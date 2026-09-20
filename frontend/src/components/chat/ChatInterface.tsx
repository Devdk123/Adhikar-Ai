"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Loader2,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  ArrowUp,
  Sparkles,
  Phone,
  Paperclip,
  Users,
  Shield,
  X,
  Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SupportedLanguage, ChatMessage } from "@/lib/types";
import { saveApplication, createApplicationFromResult } from "@/lib/applications";
import { getTranslation } from "@/lib/i18n";
import LanguageSelector from "@/components/shared/LanguageSelector";
import ChatSidebar, { type ChatSession } from "./ChatSidebar";
import VoiceCall from "./VoiceCall";

/* ── localStorage helpers ─────────────────────────── */
const STORAGE_KEY = "adhikaar-chats";

function loadSessions(): {
  sessions: ChatSession[];
  chats: Record<string, ChatMessage[]>;
} {
  if (typeof window === "undefined") return { sessions: [], chats: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sessions: [], chats: {} };
    return JSON.parse(raw);
  } catch {
    return { sessions: [], chats: {} };
  }
}

function saveSessions(
  sessions: ChatSession[],
  chats: Record<string, ChatMessage[]>
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions, chats }));
}

function generateTitle(msgs: ChatMessage[], lang: SupportedLanguage): string {
  const first = msgs.find((m) => m.role === "user");
  if (!first) return getTranslation(lang).sidebar.newChat;
  const text = first.content.slice(0, 40);
  return text.length < first.content.length ? text + "…" : text;
}

/* ── Simple markdown-ish renderer ────────────────── */
function renderFormattedText(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (listBuffer.length === 0) return;
    const items = listBuffer.map((item, i) => (
      <li key={i} className="leading-relaxed">
        {renderInline(item)}
      </li>
    ));
    if (listType === "ol") {
      elements.push(
        <ol
          key={elements.length}
          className="list-decimal list-inside space-y-1 my-2 text-sm"
        >
          {items}
        </ol>
      );
    } else {
      elements.push(
        <ul
          key={elements.length}
          className="list-disc list-inside space-y-1 my-2 text-sm"
        >
          {items}
        </ul>
      );
    }
    listBuffer = [];
    listType = null;
  }

  function renderInline(str: string): React.ReactNode {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^[\s]*[-•]\s+(.+)/);
    const numMatch = line.match(/^[\s]*(\d+)[.)]\s+(.+)/);

    if (bulletMatch) {
      if (listType === "ol") flushList();
      listType = "ul";
      listBuffer.push(bulletMatch[1]);
    } else if (numMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listBuffer.push(numMatch[2]);
    } else {
      flushList();
      if (line.trim() === "") {
        elements.push(<br key={elements.length} />);
      } else {
        elements.push(
          <p
            key={elements.length}
            className="text-[15px] leading-relaxed mb-3 last:mb-0"
          >
            {renderInline(line)}
          </p>
        );
      }
    }
  }
  flushList();
  return elements;
}

/* ── Tag parsers ─────────────────────────────────── */
function parseSchemeCards(content: string) {
  const schemeRegex = /\[SCHEME_CARD:\s*({[^}]+})\]/g;
  const cards: { name: string; score: number; benefit: string }[] = [];
  let match;
  while ((match = schemeRegex.exec(content)) !== null) {
    try {
      cards.push(JSON.parse(match[1]));
    } catch {}
  }

  let readyToApply: { schemeId: string; schemeName: string; citizenData?: Record<string, string> } | null = null;
  // Match READY_TO_APPLY with potentially nested JSON (citizenData has braces)
  const readyMatch = content.match(/\[READY_TO_APPLY:\s*(\{[\s\S]*?\})\s*\]/);
  if (readyMatch) {
    try {
      readyToApply = JSON.parse(readyMatch[1]);
    } catch {
      // Try matching deeper nested braces
      const deepMatch = content.match(/\[READY_TO_APPLY:\s*(\{[\s\S]*?citizenData[\s\S]*?\}\s*\})\s*\]/);
      if (deepMatch) {
        try { readyToApply = JSON.parse(deepMatch[1]); } catch {}
      }
    }
  }

  // Extract FAMILY_MEMBER tags
  const familyMembers: { name: string; relationship: string; gender: string; age: number }[] = [];
  const familyRegex = /\[FAMILY_MEMBER:\s*({[^}]+})\]/g;
  let fMatch;
  while ((fMatch = familyRegex.exec(content)) !== null) {
    try {
      familyMembers.push(JSON.parse(fMatch[1]));
    } catch {}
  }

  // Extract FAMILY_COMPLETE tag
  let familyComplete: { primaryName?: string; totalMembers?: number } | null = null;
  const fcMatch = content.match(/\[FAMILY_COMPLETE:\s*({[^}]+})\]/);
  if (fcMatch) {
    try { familyComplete = JSON.parse(fcMatch[1]); } catch {}
  }

  const cleanContent = content
    .replace(/\[SCHEME_CARD:\s*{[^}]+}\]/g, "")
    .replace(/\[READY_TO_APPLY:[\s\S]*?\}\s*\]/g, "")
    .replace(/\[PROFILE_COMPLETE:[^\]]+\]/g, "")
    .replace(/\[FAMILY_MEMBER:\s*{[^}]+}\]/g, "")
    .replace(/\[FAMILY_COMPLETE:\s*{[^}]+}\]/g, "")
    .trim();

  return { cleanContent, cards, readyToApply, familyMembers, familyComplete };
}

/* ── Sub-components ──────────────────────────────── */
function SchemeCardInline({
  name,
  score,
  benefit,
  onClick,
}: {
  name: string;
  score: number;
  benefit: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-purple-500/20 transition-all cursor-pointer mt-3 w-full group"
    >
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">
          {name}
        </span>
        <span className="text-xs text-muted-foreground/60 font-mono">
          {benefit}
        </span>
      </div>
      <div
        className={cn(
          "text-sm font-bold font-mono px-3 py-1 rounded-full flex-shrink-0",
          score >= 80
            ? "bg-emerald-500/15 text-emerald-400"
            : score >= 60
              ? "bg-amber-500/15 text-amber-400"
              : "bg-red-500/15 text-red-400"
        )}
      >
        {score}%
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-purple-400/60"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] transition-all"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function ApplyButton({
  data,
  language,
}: {
  data: { schemeId: string; schemeName: string; citizenData?: Record<string, string>; benefit?: string };
  language: SupportedLanguage;
}) {
  const [status, setStatus] = useState<"idle" | "filling" | "reviewing" | "submitting" | "success" | "error">("idle");
  const [refNumber, setRefNumber] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{
    screenshot_base64?: string;
    filled_fields?: { field: string; value: string; isCaptcha?: boolean; selector?: string; type?: string }[];
    has_captcha?: boolean;
    captcha_fields?: { selector: string }[];
    session_id?: string;
  } | null>(null);
  const [captchaValue, setCaptchaValue] = useState("");
  const [acceptDeclaration, setAcceptDeclaration] = useState(false);
  const sessionIdRef = useRef<string>(`chat-${Date.now()}`);

  const handleApply = async () => {
    setStatus("filling");
    try {
      const res = await fetch("/api/automate/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizenData: data.citizenData || {},
          sessionId: sessionIdRef.current,
        }),
      });
      const result = await res.json();

      if (result.status === "error" || result.status === "simulated") {
        // Fall back to direct (non-review) mode for Vercel/simulated
        setStatus("error");
        return;
      }

      // Show the review panel
      setReviewData({
        ...result,
        session_id: sessionIdRef.current,
      });
      setStatus("reviewing");
    } catch {
      setStatus("error");
    }
  };

  const handleConfirm = async () => {
    setStatus("submitting");
    try {
      const captchaSelector = reviewData?.captcha_fields?.[0]?.selector || "";
      const res = await fetch("/api/automate/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          action: "submit",
          captcha_value: captchaValue,
          captcha_selector: captchaSelector,
          accept_declaration: acceptDeclaration,
        }),
      });
      const result = await res.json();
      if (result.status === "confirmed") {
        setStatus("success");
        const ref = "ADH-" + Date.now().toString(36).toUpperCase();
        setRefNumber(ref);

        const app = createApplicationFromResult(
          data.schemeName,
          ref,
          data.benefit,
          data.citizenData
        );
        saveApplication(app);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleCancel = async () => {
    try {
      await fetch("/api/automate/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          action: "cancel",
        }),
      });
    } catch {
      // ignore
    }
    setReviewData(null);
    setStatus("idle");
    setCaptchaValue("");
    setAcceptDeclaration(false);
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
      >
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-1">
          <Check className="w-4 h-4" />
          {language === "hi" ? "आवेदन सफल!" : "Application Submitted!"}
        </div>
        {refNumber && (
          <div className="text-xs text-muted-foreground/60 font-mono">
            Ref: {refNumber}
          </div>
        )}
      </motion.div>
    );
  }

  if (status === "error") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400"
      >
        {language === "hi" ? "आवेदन विफल। कृपया पुन: प्रयास करें।" : "Application failed. Please try again."}
        <button onClick={handleApply} className="ml-2 underline hover:text-red-300">
          {language === "hi" ? "पुन: प्रयास" : "Retry"}
        </button>
      </motion.div>
    );
  }

  // ── REVIEW PANEL ──
  if (status === "reviewing" && reviewData) {
    const fields = (reviewData.filled_fields || []).filter((f) => !f.isCaptcha);

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
            <Shield className="w-4 h-4" />
            {language === "hi" ? "फॉर्म समीक्षा" : "Form Review"}
          </div>
          <button
            onClick={handleCancel}
            className="p-1 rounded-md text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Screenshot */}
        {reviewData.screenshot_base64 && (
          <div className="px-4 pt-3">
            <div className="relative rounded-xl overflow-hidden border border-white/[0.06] group cursor-pointer">
              <img
                src={`data:image/png;base64,${reviewData.screenshot_base64}`}
                alt="Form screenshot"
                className="w-full h-auto max-h-[300px] object-contain bg-white"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Filled fields table */}
        {fields.length > 0 && (
          <div className="px-4 pt-3">
            <div className="text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wider">
              {language === "hi" ? "भरे गए फ़ील्ड" : "Filled Fields"}
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto pr-2">
              {fields.map((field, i) => (
                <div
                  key={i}
                  className="flex justify-between items-baseline gap-3 text-xs py-1 border-b border-white/[0.03] last:border-0"
                >
                  <span className="text-muted-foreground/50 truncate flex-shrink-0 max-w-[45%]">
                    {field.field || "—"}
                  </span>
                  <span className="text-foreground/80 font-mono text-right truncate">
                    {field.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Captcha input */}
        {reviewData.has_captcha && (
          <div className="px-4 pt-3">
            <label className="block text-xs font-semibold text-foreground/60 mb-1.5 uppercase tracking-wider">
              {language === "hi" ? "कैप्चा दर्ज करें" : "Enter Captcha"}
            </label>
            <input
              type="text"
              value={captchaValue}
              onChange={(e) => setCaptchaValue(e.target.value)}
              placeholder={language === "hi" ? "स्क्रीनशॉट में दिखाया गया कैप्चा टाइप करें" : "Type the captcha shown in the screenshot"}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-purple-500/40 transition-colors"
            />
          </div>
        )}

        {/* Declaration checkbox */}
        <div className="px-4 pt-3">
          <label className="flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptDeclaration}
              onChange={(e) => setAcceptDeclaration(e.target.checked)}
              className="mt-0.5 accent-purple-500"
            />
            <span className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground/80 transition-colors leading-relaxed">
              {language === "hi"
                ? "मैंने सभी जानकारी की समीक्षा कर ली है और यह सही है। मैं फॉर्म जमा करने के लिए सहमत हूं।"
                : "I have reviewed all the information and it is correct. I consent to submitting this form."}
            </span>
          </label>
        </div>

        {/* Confirm/Cancel buttons */}
        <div className="flex gap-2 px-4 py-4">
          <button
            onClick={handleConfirm}
            disabled={!acceptDeclaration || (reviewData.has_captcha && !captchaValue.trim())}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            {language === "hi" ? "जमा करें" : "Submit"}
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] hover:bg-red-500/10 hover:border-red-500/20 text-muted-foreground hover:text-red-400 font-medium text-sm transition-all"
          >
            <X className="w-4 h-4" />
            {language === "hi" ? "रद्द करें" : "Cancel"}
          </button>
        </div>
      </motion.div>
    );
  }

  // ── SUBMITTING STATE ──
  if (status === "submitting") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-4 flex items-center gap-3 px-5 py-3 rounded-xl border border-purple-500/20 bg-purple-500/5 text-sm text-purple-400"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        {language === "hi" ? "फॉर्म जमा हो रहा है..." : "Submitting the form..."}
      </motion.div>
    );
  }

  // ── DEFAULT: Apply / Filling button ──
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleApply}
      disabled={status === "filling"}
      className="mt-4 flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/20 disabled:opacity-60"
    >
      {status === "filling" ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {language === "hi" ? "फॉर्म भरा जा रहा है..." : "Filling form for review..."}
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          {language === "hi"
            ? `${data.schemeName} के लिए आवेदन करें`
            : `Apply for ${data.schemeName}`}
        </>
      )}
    </motion.button>
  );
}

/* ── Main Component ──────────────────────────────── */
export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>("hi");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Sidebar state ── */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [allChats, setAllChats] = useState<Record<string, ChatMessage[]>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const { sessions: s, chats: c } = loadSessions();
    setSessions(s);
    setAllChats(c);
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (sessions.length > 0 || Object.keys(allChats).length > 0) {
      saveSessions(sessions, allChats);
    }
  }, [sessions, allChats]);

  // Persist current messages to active session
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      setAllChats((prev) => ({ ...prev, [activeSessionId]: messages }));
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, title: generateTitle(messages, language), updatedAt: Date.now() }
            : s
        )
      );
    }
  }, [messages, activeSessionId, language]);

  const isEmptyState = messages.length === 0;

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  function handleNewChat() {
    const id = Date.now().toString();
    const session: ChatSession = {
      id,
      title: getTranslation(language).sidebar.newChat,
      updatedAt: Date.now(),
    };
    setSessions((prev) => [session, ...prev]);
    setAllChats((prev) => ({ ...prev, [id]: [] }));
    setActiveSessionId(id);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  function handleSelectSession(id: string) {
    setActiveSessionId(id);
    setMessages(allChats[id] || []);
  }

  function handleDeleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setAllChats((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
    // Update localStorage
    const newSessions = sessions.filter((s) => s.id !== id);
    const newChats = { ...allChats };
    delete newChats[id];
    saveSessions(newSessions, newChats);
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    // Auto-create session if none active
    if (!activeSessionId) {
      const id = Date.now().toString();
      const session: ChatSession = {
        id,
        title: content.trim().slice(0, 40),
        updatedAt: Date.now(),
      };
      setSessions((prev) => [session, ...prev]);
      setAllChats((prev) => ({ ...prev, [id]: [] }));
      setActiveSessionId(id);
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      language,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const chatHistory = [...messages, userMessage]
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, language }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        language,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getTranslation(language).chat.errorMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  const [ocrLoading, setOcrLoading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isImage = file.type.startsWith("image/");

    if (isImage) {
      // OCR flow — extract data from document image
      setOcrLoading(true);

      const scanMsg = language === "hi"
        ? `📄 दस्तावेज़ स्कैन किया जा रहा है: ${file.name}...`
        : `📄 Scanning document: ${file.name}...`;

      // Show scanning message immediately
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-scan",
          role: "system" as const,
          content: scanMsg,
          timestamp: new Date(),
        },
      ]);

      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();

        if (res.ok && result.profile_fields) {
          const p = result.profile_fields;
          const docType = result.document_type?.replace(/_/g, " ") || "document";
          const confidence = Math.round((result.confidence || 0) * 100);

          // Build a natural message with extracted data
          let extractedMsg: string;
          if (language === "hi") {
            const parts: string[] = [];
            if (p.name) parts.push(`नाम: ${p.name}`);
            if (p.age) parts.push(`उम्र: ${p.age}`);
            if (p.gender) parts.push(`लिंग: ${p.gender === "Male" ? "पुरुष" : p.gender === "Female" ? "महिला" : p.gender}`);
            if (p.state) parts.push(`राज्य: ${p.state}`);
            if (p.district) parts.push(`जिला: ${p.district}`);
            if (p.aadhaar) parts.push(`आधार: ${p.aadhaar}`);
            if (p.category) parts.push(`श्रेणी: ${p.category}`);

            extractedMsg = `मैंने अपना ${docType} अपलोड किया है। इसमें ये जानकारी है:\n${parts.join("\n")}\n\nये सही है, कृपया इसके आधार पर आगे बढ़ें।`;

            if (p.family_members?.length) {
              extractedMsg += `\n\nपरिवार के सदस्य:\n${p.family_members.map((m: { name: string; age: number; gender: string; relationship: string }) => `- ${m.name} (${m.age}, ${m.gender}, ${m.relationship})`).join("\n")}`;
            }
          } else {
            const parts: string[] = [];
            if (p.name) parts.push(`Name: ${p.name}`);
            if (p.age) parts.push(`Age: ${p.age}`);
            if (p.gender) parts.push(`Gender: ${p.gender}`);
            if (p.state) parts.push(`State: ${p.state}`);
            if (p.district) parts.push(`District: ${p.district}`);
            if (p.aadhaar) parts.push(`Aadhaar: ${p.aadhaar}`);
            if (p.category) parts.push(`Category: ${p.category}`);

            extractedMsg = `I uploaded my ${docType} (${confidence}% confidence). Here's what it contains:\n${parts.join("\n")}\n\nThis is correct, please proceed based on this information.`;

            if (p.family_members?.length) {
              extractedMsg += `\n\nFamily members:\n${p.family_members.map((m: { name: string; age: number; gender: string; relationship: string }) => `- ${m.name} (${m.age}, ${m.gender}, ${m.relationship})`).join("\n")}`;
            }
          }

          // Remove the scanning message and send the extracted data as a user message
          setMessages((prev) => prev.filter((m) => !m.id.endsWith("-scan")));
          sendMessage(extractedMsg);
        } else {
          // OCR failed — fall back to simple file name message
          setMessages((prev) => prev.filter((m) => !m.id.endsWith("-scan")));
          const fallbackMsg = language === "hi"
            ? `मैंने ये दस्तावेज़ अपलोड किये हैं: ${file.name}`
            : `I have uploaded these documents: ${file.name}`;
          sendMessage(fallbackMsg);
        }
      } catch {
        setMessages((prev) => prev.filter((m) => !m.id.endsWith("-scan")));
        const fallbackMsg = language === "hi"
          ? `मैंने ये दस्तावेज़ अपलोड किये हैं: ${file.name}`
          : `I have uploaded these documents: ${file.name}`;
        sendMessage(fallbackMsg);
      } finally {
        setOcrLoading(false);
      }
    } else {
      // Non-image files — original behavior
      const fileNames = Array.from(files).map((f) => f.name);
      const label = fileNames.join(", ");
      const msg =
        language === "hi"
          ? `मैंने ये दस्तावेज़ अपलोड किये हैं: ${label}`
          : `I have uploaded these documents: ${label}`;
      sendMessage(msg);
    }

    // Reset so the same file can be re-uploaded
    e.target.value = "";
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const t = getTranslation(language).chat;

  const SUGGESTED_PROMPTS = [
    {
      title: t.suggestedPrompts.farmer,
      prompt: language === "hi" ? "मैं UP से किसान हूँ, कौन सी योजनाएँ हैं?" : "I am a farmer from UP, what schemes are available?",
      icon: "🌾",
    },
    {
      title: t.suggestedPrompts.healthcare,
      prompt: language === "hi" ? "मेरे परिवार के लिए स्वास्थ्य योजनाएं" : "Healthcare schemes for my family",
      icon: "❤️",
    },
    {
      title: t.suggestedPrompts.employment,
      prompt: language === "hi" ? "मैं बिहार से किसान हूँ, आय ₹1L से कम है" : "I'm a farmer from Bihar, income below ₹1L",
      icon: "💼",
    },
    {
      title: t.suggestedPrompts.women,
      prompt: language === "hi" ? "महिला उद्यमियों के लिए योजनाएं" : "Schemes for women entrepreneurs",
      icon: "🎓",
    },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* ── Sidebar ── */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        language={language}
      />

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            {sidebarCollapsed && <div className="w-8" />}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {t.headerTitle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVoiceCall(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-medium transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              {language === "hi" ? "वॉइस कॉल" : "Voice Call"}
            </button>
            <LanguageSelector value={language} onChange={setLanguage} />
          </div>
        </div>

        {/* Scroll area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {isEmptyState ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4 w-full">
              {/* Hero icon */}
              <div className="relative mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/10">
                  <Sparkles className="w-7 h-7 text-purple-400" />
                </div>
                <div className="absolute -inset-4 bg-purple-500/5 rounded-3xl blur-2xl -z-10" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-foreground font-[family-name:var(--font-display)]">
                {t.emptyHeading}
              </h1>
              <p className="text-sm text-muted-foreground/50 mb-10 text-center max-w-md">
                {t.emptySubtitle}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
                {SUGGESTED_PROMPTS.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(item.prompt)}
                    className="flex flex-col items-start p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 font-medium text-foreground text-sm mb-1">
                      <span className="text-base">{item.icon}</span>
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors line-clamp-1">
                      {item.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Messages ── */
            <div className="max-w-3xl mx-auto w-full pb-8 pt-2">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const { cleanContent, cards, readyToApply, familyMembers, familyComplete } = parseSchemeCards(msg.content);
                  const isUser = msg.role === "user";

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-4 sm:px-6 py-5 group"
                    >
                      <div className="flex gap-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0 pt-0.5">
                          {isUser ? (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-white" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/20 flex items-center justify-center">
                              <Bot className="w-3.5 h-3.5 text-purple-400" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wider">
                            {isUser ? t.userName : t.botName}
                          </div>
                          <div className="text-foreground/90 max-w-none">
                            {renderFormattedText(cleanContent)}
                          </div>

                          {cards.length > 0 && (
                            <div className="mt-3 space-y-2 max-w-xl">
                              {cards.map((card, i) => (
                                <SchemeCardInline
                                  key={i}
                                  {...card}
                                  onClick={() =>
                                    sendMessage(
                                      `I want to apply for ${card.name}. Tell me what documents I need and help me apply.`
                                    )
                                  }
                                />
                              ))}
                            </div>
                          )}

                          {/* Apply Now button */}
                          {readyToApply && (
                            <ApplyButton
                              data={{
                                ...readyToApply,
                                benefit: cards.find((c) => c.name.toLowerCase().includes(readyToApply.schemeName.toLowerCase().split(" ")[0]))?.benefit
                                  || cards[0]?.benefit,
                              }}
                              language={language}
                            />
                          )}

                          {/* Family member badges */}
                          {familyMembers.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 flex flex-wrap gap-2"
                            >
                              {familyMembers.map((member, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs"
                                >
                                  <Users className="w-3.5 h-3.5 text-purple-400" />
                                  <span className="font-medium text-foreground/80">{member.name}</span>
                                  <span className="text-muted-foreground/50">
                                    {member.relationship} &middot; {member.age}y &middot; {member.gender}
                                  </span>
                                </div>
                              ))}
                            </motion.div>
                          )}

                          {/* Family complete summary */}
                          {familyComplete && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mt-3 p-4 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-indigo-500/5"
                            >
                              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1">
                                <Users className="w-4 h-4" />
                                {language === "hi"
                                  ? `${familyComplete.primaryName || ""} परिवार — ${familyComplete.totalMembers} सदस्य`
                                  : `${familyComplete.primaryName || ""} Family — ${familyComplete.totalMembers} members`}
                              </div>
                              <div className="text-xs text-muted-foreground/60">
                                {language === "hi"
                                  ? "सभी सदस्यों के लिए योजनाएं खोजी जा रही हैं..."
                                  : "Finding schemes for all family members..."}
                              </div>
                            </motion.div>
                          )}

                          {/* Actions — hover reveal */}
                          {!isUser && (
                            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <CopyButton text={cleanContent} />
                              <button
                                onClick={() => {
                                  const lastUserMsg = [...messages]
                                    .reverse()
                                    .find((m) => m.role === "user");
                                  if (lastUserMsg)
                                    sendMessage(lastUserMsg.content);
                                }}
                                className="p-1.5 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] transition-all"
                                title={t.regenerate}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 sm:px-6 py-5"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/20 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-foreground/70 mb-1.5 uppercase tracking-wider">
                        {t.botName}
                      </div>
                      <TypingIndicator />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-6 pt-2">
          <div className="relative flex flex-col w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] focus-within:border-white/[0.14] focus-within:bg-white/[0.04] transition-all shadow-lg shadow-black/10">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30 resize-none max-h-[200px] overflow-y-auto px-4 pt-4 pb-12 min-h-[56px] text-[15px] leading-relaxed"
              rows={1}
              disabled={isLoading}
            />

            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ocrLoading}
                  className="p-2 text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] rounded-full transition-colors disabled:opacity-50"
                  title={language === "hi" ? (ocrLoading ? "स्कैन हो रहा है..." : "दस्तावेज़ अपलोड करें") : (ocrLoading ? "Scanning..." : "Upload documents")}
                >
                  {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </button>
                <button
                  className="p-2 text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] rounded-full transition-colors"
                  title={t.voiceInput}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-2 rounded-full flex items-center justify-center transition-all",
                  input.trim() && !isLoading
                    ? "bg-purple-500 text-white hover:bg-purple-400 shadow-lg shadow-purple-500/20"
                    : "bg-white/[0.06] text-white/20"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="text-center mt-3">
            <span className="text-[11px] text-muted-foreground/30">
              {t.disclaimer}
            </span>
          </div>
        </div>
      </div>

      {/* Voice Call overlay */}
      <AnimatePresence>
        {showVoiceCall && (
          <VoiceCall
            onClose={() => setShowVoiceCall(false)}
            language={language}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
