"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SupportedLanguage, LANGUAGE_LABELS } from "@/lib/types";

interface LanguageSelectorProps {
  value: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  className?: string;
}

export default function LanguageSelector({
  value,
  onChange,
  className,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const languages: SupportedLanguage[] = ["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "or"];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/[0.05] transition-all text-sm font-medium text-foreground/80 hover:text-foreground group"
      >
        <Globe className="w-4 h-4 text-muted-foreground group-hover:text-purple-400 transition-colors" />
        <span>{LANGUAGE_LABELS[value]}</span>
        <ChevronDown 
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 min-w-[140px]"
          >
            {/* Popover Tip */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-l border-t border-white/[0.08] rotate-45 rounded-tl-sm" />
            
            <div className="relative bg-card border border-white/[0.08] rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    onChange(lang);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-[15px] font-medium transition-all mb-0.5 last:mb-0",
                    value === lang
                      ? "bg-white/[0.08] text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                  )}
                >
                  {LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
