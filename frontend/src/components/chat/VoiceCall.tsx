"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  useVoiceAssistant,
  useChat,
  useLocalParticipant,
  useRoomContext,
  RoomAudioRenderer,
} from "@livekit/components-react";
import {
  Phone,
  PhoneOff,
  Loader2,
  Mic,
  MicOff,
  MessageSquareText,
  ArrowUp,
  ArrowLeft,
  Zap,
  X,
  CheckCircle2,
  Paperclip,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SupportedLanguage } from "@/lib/types";
import { AgentAudioVisualizerAura } from "@/components/agent-audio-visualizer-aura";
import { saveApplication, createApplicationFromResult } from "@/lib/applications";

interface VoiceCallProps {
  onClose: () => void;
  language: SupportedLanguage;
}

/** Review data received from agent via LiveKit data channel */
interface ReviewData {
  type: "REVIEW_REQUEST";
  sessionId: string;
  fields: Record<string, string>;
  portalUrl?: string;
  screenshot?: string; // base64-encoded PNG
}

/* ── HITL Review Panel (voice flow) ─────────────────────── */

function VoiceReviewPanel({
  review,
  language,
  onConfirm,
  onCancel,
}: {
  review: ReviewData;
  language: SupportedLanguage;
  onConfirm: (captcha: string) => void;
  onCancel: () => void;
}) {
  const [captchaValue, setCaptchaValue] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-x-2 bottom-20 z-50 rounded-2xl border border-white/[0.08] bg-[rgba(12,12,24,0.95)] backdrop-blur-xl p-4 max-h-[70vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          {language === "hi" ? "फॉर्म की समीक्षा करें" : "Review Filled Form"}
        </h3>
        <button onClick={onCancel} className="text-white/30 hover:text-white/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Screenshot */}
      {review.screenshot && (
        <div className="mb-3 rounded-lg overflow-hidden border border-white/[0.06]">
          <img
            src={`data:image/png;base64,${review.screenshot}`}
            alt="Form screenshot"
            className="w-full h-auto"
          />
        </div>
      )}

      {/* Filled fields */}
      <div className="space-y-1.5 mb-3">
        <p className="text-[10px] uppercase tracking-wider text-white/30 font-medium">
          {language === "hi" ? "भरे गए फ़ील्ड" : "Filled Fields"}
        </p>
        {Object.entries(review.fields).map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-center text-[11px] py-1 px-2 rounded bg-white/[0.03]"
          >
            <span className="text-white/40 capitalize">
              {key.replace(/_/g, " ")}
            </span>
            <span className="text-white/80 font-mono text-[10px]">{value}</span>
          </div>
        ))}
      </div>

      {/* Captcha input */}
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-wider text-white/30 font-medium mb-1">
          {language === "hi" ? "कैप्चा दर्ज करें" : "Enter Captcha"}
        </label>
        <input
          type="text"
          value={captchaValue}
          onChange={(e) => setCaptchaValue(e.target.value)}
          placeholder={language === "hi" ? "कैप्चा कोड" : "Captcha code"}
          className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-sm text-white placeholder:text-white/20 outline-none focus:border-purple-500/30"
        />
      </div>

      {/* Confirm / Cancel buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg text-xs font-medium bg-white/[0.05] text-white/60 hover:bg-white/[0.1] transition-colors flex items-center justify-center gap-1.5"
        >
          <XCircle className="w-3.5 h-3.5" />
          {language === "hi" ? "रद्द करें" : "Cancel"}
        </button>
        <button
          onClick={() => onConfirm(captchaValue)}
          disabled={!captchaValue.trim()}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
            captchaValue.trim()
              ? "bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/20"
              : "bg-white/[0.03] text-white/20 cursor-not-allowed"
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {language === "hi" ? "पुष्टि करें" : "Confirm & Submit"}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Control bar ─────────────────────────────────────── */

function CustomControlBar({
  onDisconnect,
  language,
}: {
  onDisconnect: () => void;
  language: SupportedLanguage;
}) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const { send: sendChat, chatMessages } = useChat();
  const [micEnabled, setMicEnabled] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fast Apply state — just tracks whether we've sent the message
  const [fastApplySent, setFastApplySent] = useState(false);
  const savedRefsRef = useRef<Set<string>>(new Set());

  // HITL Review state — received from agent via data channel
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);

  // Listen for data channel messages from the agent (HITL review)
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      participant: unknown,
      kind: unknown,
      topic?: string
    ) => {
      if (topic !== "adhikaar-review") return;

      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text) as ReviewData;
        if (data.type === "REVIEW_REQUEST") {
          setReviewData(data);
          setChatOpen(true); // Ensure chat panel is visible
        }
      } catch (err) {
        console.warn("Failed to parse review data from data channel:", err);
      }
    };

    room.on("dataReceived", handleDataReceived);
    return () => {
      room.off("dataReceived", handleDataReceived);
    };
  }, [room]);

  const handleReviewConfirm = async (captcha: string) => {
    if (!reviewData) return;

    try {
      // Write confirmation via the API route
      await fetch("/api/automate/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: reviewData.sessionId,
          action: "submit",
          captcha,
        }),
      });
    } catch (err) {
      console.error("Failed to send confirmation:", err);
    }

    setReviewData(null);
  };

  const handleReviewCancel = async () => {
    if (!reviewData) return;

    try {
      await fetch("/api/automate/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: reviewData.sessionId,
          action: "cancel",
        }),
      });
    } catch (err) {
      console.error("Failed to send cancellation:", err);
    }

    setReviewData(null);
  };

  // Watch agent messages for successful application references
  useEffect(() => {
    for (const msg of chatMessages) {
      // Only look at agent messages (not local user)
      if (msg.from?.isLocal) continue;
      const text = msg.message;

      // Match patterns like "Reference Number: ADH-xxx" or "reference number is ADH-xxx"
      const refMatch = text.match(/(?:Reference\s*(?:Number|No\.?|#)\s*(?:is|:)\s*)([A-Z0-9-]+)/i);
      if (refMatch && !savedRefsRef.current.has(refMatch[1])) {
        const ref = refMatch[1];
        savedRefsRef.current.add(ref);

        // Try to extract scheme name from message
        const schemeMatch = text.match(/(?:Applied for|applied for|scheme[:\s]+)([^.,(]+)/i);
        const schemeName = schemeMatch?.[1]?.trim() || "Government Scheme";

        // Try to extract benefit
        const benefitMatch = text.match(/(?:Benefit|benefit)[:\s]+(₹[^\s.,]+(?:\/\w+)?)/i);

        const app = createApplicationFromResult(
          schemeName,
          ref,
          benefitMatch?.[1],
        );
        saveApplication(app);
      }
    }
  }, [chatMessages]);

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(!micEnabled);
    setMicEnabled(!micEnabled);
  };

  useEffect(() => {
    setMicEnabled(localParticipant.isMicrophoneEnabled);
  }, [localParticipant.isMicrophoneEnabled]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;
    await sendChat(text);
    setChatInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileNames = Array.from(files).map((f) => f.name);
    const label = fileNames.join(", ");
    const msg =
      language === "hi"
        ? `मैंने ये दस्तावेज़ अपलोड किये: ${label}`
        : `Documents uploaded: ${label}`;

    await sendChat(msg);
    e.target.value = "";
  };

  const handleFastApply = async () => {
    if (fastApplySent) return;
    setFastApplySent(true);

    // Demo shortcut — uses sample data to demonstrate the fast apply flow.
    // In production, this would be pre-filled from a real citizen profile (e.g. from Aadhaar scan).
    const msg =
      "FAST APPLY: My name is Ramesh Kumar, I am a 35 year old male farmer from Uttar Pradesh. " +
      "My annual income is around 80000 rupees, I belong to OBC category, I have a BPL card and I own land. " +
      "My Aadhaar is 1234 5678 9012, father's name is Shri Suresh Kumar, date of birth 1991-03-15, mobile 9876543210. " +
      "District Lucknow, Block Mohanlalganj, Village Rampur. Bank State Bank of India, account 32145678901, IFSC SBIN0001234. " +
      "Please find the best scheme for me and apply right away.";

    try {
      await sendChat(msg);
      setChatOpen(true);
    } catch (err) {
      console.error("Failed to send fast apply message:", err);
      setFastApplySent(false);
    }
  };

  return (
    <div className="relative w-full max-w-md space-y-3 px-2">
      {/* HITL Review Panel overlay */}
      <AnimatePresence>
        {reviewData && (
          <VoiceReviewPanel
            review={reviewData}
            language={language}
            onConfirm={handleReviewConfirm}
            onCancel={handleReviewCancel}
          />
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
                <span className="text-[10px] font-medium tracking-wider uppercase text-white/30">
                  Chat
                </span>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white/20 hover:text-white/50 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-44 overflow-y-auto p-3 space-y-2">
                {chatMessages.length === 0 && (
                  <p className="text-[11px] text-white/20 text-center py-4">
                    {language === "hi"
                      ? "टेक्स्ट से भी बात कर सकते हैं"
                      : "You can also type to communicate"}
                  </p>
                )}
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.from?.isLocal ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "text-[11px] leading-relaxed px-3 py-2 rounded-2xl max-w-[85%]",
                        msg.from?.isLocal
                          ? "bg-purple-500/15 text-purple-200/90 rounded-br-md"
                          : "bg-white/[0.05] text-white/70 rounded-bl-md"
                      )}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03]">
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
                    className="p-1 text-white/20 hover:text-white/50 transition-colors flex-shrink-0"
                    title={language === "hi" ? "दस्तावेज़ अपलोड" : "Upload document"}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    placeholder={
                      language === "hi" ? "टाइप करें..." : "Type a message..."
                    }
                    className="flex-1 bg-transparent border-none outline-none text-xs text-foreground placeholder:text-white/15"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim()}
                    className={cn(
                      "p-1 rounded-full transition-all flex-shrink-0",
                      chatInput.trim()
                        ? "bg-purple-500 text-white"
                        : "bg-white/[0.04] text-white/15"
                    )}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={toggleMic}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all border",
            micEnabled
              ? "bg-white/[0.06] border-white/[0.1] text-foreground hover:bg-white/[0.1]"
              : "bg-red-500/15 border-red-500/20 text-red-400"
          )}
        >
          {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all border",
            chatOpen
              ? "bg-blue-500/15 border-blue-500/20 text-blue-400"
              : "bg-white/[0.06] border-white/[0.1] text-foreground hover:bg-white/[0.1]"
          )}
        >
          <MessageSquareText className="w-5 h-5" />
        </button>

        {/* Fast Apply — dev/demo only */}
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={handleFastApply}
            disabled={fastApplySent}
            title={language === "hi" ? "त्वरित आवेदन (डेमो)" : "Quick Demo Apply (Dev)"}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all border",
              fastApplySent
                ? "bg-green-500/15 border-green-500/20 text-green-400"
                : "bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20 text-purple-400 hover:from-purple-500/20 hover:to-indigo-500/20"
            )}
          >
            {fastApplySent ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
          </button>
        )}

        <button
          onClick={onDisconnect}
          className="px-6 h-12 rounded-full bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25 text-xs font-bold tracking-wider font-mono transition-all flex items-center gap-2"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">END CALL</span>
          <span className="sm:hidden">END</span>
        </button>
      </div>
    </div>
  );
}

/* ── Voice session ───────────────────────────────────── */

function VoiceCallSession({
  onClose,
  language,
}: {
  onClose: () => void;
  language: SupportedLanguage;
}) {
  const { state, audioTrack } = useVoiceAssistant();

  const statusText: Record<string, string> = {
    disconnected: language === "hi" ? "कनेक्ट हो रहा है..." : "Connecting...",
    connecting: language === "hi" ? "कनेक्ट हो रहा है..." : "Connecting...",
    initializing: language === "hi" ? "शुरू हो रहा है..." : "Initializing...",
    listening: language === "hi" ? "सुन रहा हूँ... बोलिए" : "Listening... speak now",
    thinking: language === "hi" ? "सोच रहा हूँ..." : "Thinking...",
    speaking: language === "hi" ? "बोल रहा हूँ..." : "Speaking...",
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-6 px-4">
      <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
        <AgentAudioVisualizerAura
          state={state}
          audioTrack={audioTrack}
          color="#8B5CF6"
          colorShift={0.3}
          size="xl"
          themeMode="dark"
          className="w-full h-full"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <h2 className="text-xl font-semibold text-white mb-1 font-[family-name:var(--font-display)]">
            {language === "hi" ? "अधिकार AI" : "Adhikaar AI"}
          </h2>
          <motion.p
            key={state}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-sm",
              state === "listening"
                ? "text-emerald-400"
                : state === "speaking"
                  ? "text-purple-300"
                  : state === "thinking"
                    ? "text-amber-400"
                    : "text-white/60"
            )}
          >
            {statusText[state] || statusText.connecting}
          </motion.p>
        </div>
      </div>

      <CustomControlBar onDisconnect={onClose} language={language} />
      <RoomAudioRenderer />
    </div>
  );
}

/* ── Main component ──────────────────────────────────── */

export default function VoiceCall({ onClose, language }: VoiceCallProps) {
  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCall = useCallback(async () => {
    setConnectionState("connecting");
    setError(null);

    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantName: "citizen" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setToken(data.token);
      setServerUrl(data.url);
      setConnectionState("connected");
    } catch (err) {
      console.error("Failed to get token:", err);
      setError(
        language === "hi"
          ? "कनेक्शन विफल। पुनः प्रयास करें।"
          : "Connection failed. Please try again."
      );
      setConnectionState("error");
    }
  }, [language]);

  const handleDisconnect = useCallback(() => {
    setToken(null);
    setServerUrl(null);
    setConnectionState("idle");
    onClose();
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[rgba(6,6,14,0.98)] flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{language === "hi" ? "वापस" : "Back"}</span>
        </button>
        <div className="text-sm font-medium text-foreground/70">
          {language === "hi" ? "अधिकार वॉइस" : "Adhikaar Voice"}
        </div>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex items-center justify-center">
        {connectionState === "idle" || connectionState === "error" ? (
          <div className="flex flex-col items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white font-[family-name:var(--font-display)]">
              A
            </div>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-1 font-[family-name:var(--font-display)]">
                {language === "hi" ? "अधिकार AI" : "Adhikaar AI"}
              </h2>
              <p className="text-sm text-muted-foreground/60">
                {language === "hi" ? "वॉइस कॉल शुरू करें" : "Start a voice call"}
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center max-w-xs">{error}</p>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startCall}
              className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center shadow-lg shadow-green-500/20 transition-colors"
            >
              <Phone className="w-8 h-8 text-white" />
            </motion.button>

            <button
              onClick={onClose}
              className="text-sm text-muted-foreground/40 hover:text-foreground transition-colors"
            >
              {language === "hi" ? "वापस जाएं" : "Go back"}
            </button>
          </div>
        ) : connectionState === "connecting" ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <p className="text-sm text-muted-foreground/60">
              {language === "hi"
                ? "कनेक्ट हो रहा है..."
                : "Connecting to Adhikaar AI..."}
            </p>
          </div>
        ) : token && serverUrl ? (
          <LiveKitRoom
            token={token}
            serverUrl={serverUrl}
            connect={true}
            audio={true}
            video={false}
            onDisconnected={handleDisconnect}
            className="w-full h-full flex items-center justify-center"
          >
            <VoiceCallSession onClose={handleDisconnect} language={language} />
          </LiveKitRoom>
        ) : null}
      </div>
    </motion.div>
  );
}
