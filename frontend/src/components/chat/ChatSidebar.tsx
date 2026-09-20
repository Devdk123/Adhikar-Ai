"use client";

import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Search,
  PanelLeftClose,
  PanelLeft,
  Trash2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getTranslation } from "@/lib/i18n";
import { SupportedLanguage } from "@/lib/types";

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  language: SupportedLanguage;
}

function timeLabel(ts: number, lang: SupportedLanguage): string {
  const now = Date.now();
  const diff = now - ts;
  const day = 86_400_000;
  const t = getTranslation(lang).sidebar;

  if (diff < day) return t.today;
  if (diff < day * 2) return t.yesterday;
  if (diff < day * 7) return t.last7Days;
  return t.older;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  collapsed,
  onToggle,
  language,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const t = getTranslation(language).sidebar;

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  // Group by time
  const groups: Record<string, ChatSession[]> = {};
  filtered.forEach((s) => {
    const label = timeLabel(s.updatedAt, language);
    if (!groups[label]) groups[label] = [];
    groups[label].push(s);
  });

  const groupOrder = [t.today, t.yesterday, t.last7Days, t.older];

  return (
    <>
      {/* Collapsed toggle — fixed button */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}

      <AnimatePresence>
        {!collapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-shrink-0 h-full overflow-hidden border-r border-white/[0.06] bg-[rgba(10,10,18,0.95)]"
          >
            <div className="flex flex-col h-full w-[280px]">
              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <Link
                  href="/"
                  className="text-lg font-bold font-[family-name:var(--font-display)] tracking-tight shimmer-text"
                >
                  ADHIKAAR
                </Link>
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* New Chat */}
              <div className="px-3 pb-2">
                <button
                  onClick={onNewChat}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-sm font-medium text-foreground transition-colors"
                >
                  <Plus className="w-4 h-4 text-purple-400" />
                  {t.newChat}
                </button>
              </div>

              {/* Search */}
              <div className="px-3 pb-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                  <Search className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/40 w-full"
                  />
                </div>
              </div>

              {/* Chat list */}
              <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-hide">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                    <Sparkles className="w-8 h-8 text-purple-400/30 mb-3" />
                    <p className="text-xs text-muted-foreground/50">
                      {t.emptyState}
                    </p>
                  </div>
                ) : (
                  groupOrder.map((group) => {
                    const items = groups[group];
                    if (!items || items.length === 0) return null;
                    return (
                      <div key={group} className="mb-3">
                        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/30">
                          {group}
                        </div>
                        {items.map((session) => (
                          <div
                            key={session.id}
                            onMouseEnter={() => setHoveredId(session.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className="relative group/item"
                          >
                            <button
                              onClick={() => onSelectSession(session.id)}
                              className={cn(
                                "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left text-sm transition-colors",
                                activeSessionId === session.id
                                  ? "bg-white/[0.08] text-foreground"
                                  : "text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.04]"
                              )}
                            >
                              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                              <span className="truncate flex-1 text-[13px]">
                                {session.title}
                              </span>
                            </button>
                            {hoveredId === session.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(session.id);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/10 text-muted-foreground/50 hover:text-red-400 transition-colors z-10"
                                title={language === "hi" ? "हटाएं" : "Delete"}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-3 py-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">
                      {t.footerTitle}
                    </div>
                    <div className="text-[10px] text-muted-foreground/40">
                      {t.footerSubtitle}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
