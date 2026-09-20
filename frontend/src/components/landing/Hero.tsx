"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Mic,
  ArrowRight,
  Shield,
  Zap,
  FileCheck,
  Bot,
  Languages,
  Sparkles,
  ChevronLeft,
  MonitorPlay,
  Globe,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Camera,
  Check,
  Play,
  Lock,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import GradientText from "@/components/shared/GradientText";
import FaqSection from "@/components/ui/faq-sections";

/* ── ReactBits components ──────────────────────── */
import BlurText from "@/components/reactbits/BlurText";
import CountUp from "@/components/reactbits/CountUp";
import ShinyText from "@/components/reactbits/ShinyText";
import DecryptedText from "@/components/reactbits/DecryptedText";
import ScrollVelocity from "@/components/reactbits/ScrollVelocity";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import Magnet from "@/components/reactbits/Magnet";
import ClickSpark from "@/components/reactbits/ClickSpark";
import FlowingMenu from "@/components/reactbits/FlowingMenu";

/* ── WhatsApp-style demo for hero ─────────────────── */

/* WhatsApp dark mode palette — authentic colors */
const wa = {
  bg: "#060A0F",
  header: "#0C1317",
  bubbleIn: "#111921",
  bubbleOut: "#003A30",
  text: "#E9EDEF",
  textSec: "#8696A0",
  ticks: "#53BDEB",
  green: "#00A884",
  inputBg: "#161F26",
  inputBar: "#0C1317",
};

function BlueTicks() {
  return (
    <span className="inline-flex ml-1">
      <Check className="w-3 h-3 -mr-1.5" style={{ color: wa.ticks }} />
      <Check className="w-3 h-3" style={{ color: wa.ticks }} />
    </span>
  );
}

function VoiceNoteWaveform() {
  const bars = [3, 6, 4, 8, 5, 10, 7, 12, 6, 9, 4, 11, 5, 8, 3, 7, 10, 5, 6, 4, 8, 3, 5, 7, 4];
  return (
    <div className="flex items-center gap-[1.5px] h-5">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full"
          style={{
            height: `${h}px`,
            backgroundColor: "rgba(255,255,255,0.5)",
            animation: `voice-bar 0.9s ease-in-out ${i * 0.05}s infinite`,
            ["--bar-h" as string]: `${h + 4}px`,
          }}
        />
      ))}
    </div>
  );
}

function HeroChatDemo() {
  return (
    <div className="relative flex items-center justify-center">
      {/* ── Saturn Ring System ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          top: "50%",
          left: "46%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Ambient glow behind ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: 340,
            height: 340,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(99,102,241,0.08) 50%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />

        {/* Outer ring — glow layer (blurred) */}
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: 560,
            height: 560,
            marginTop: -280,
            marginLeft: -280,
            animation: "saturn-drift 14s ease-in-out infinite",
            transformStyle: "preserve-3d",
          }}
        >
          <svg viewBox="0 0 560 560" fill="none" className="w-full h-full" style={{ filter: "blur(6px)", animation: "saturn-glow 8s ease-in-out infinite" }}>
            <defs>
              <linearGradient id="ring-glow" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="rgba(168,85,247,0)" />
                <stop offset="20%" stopColor="rgba(168,85,247,0.5)" />
                <stop offset="50%" stopColor="rgba(139,92,246,0.7)" />
                <stop offset="80%" stopColor="rgba(99,102,241,0.5)" />
                <stop offset="100%" stopColor="rgba(99,102,241,0)" />
              </linearGradient>
            </defs>
            <ellipse cx="280" cy="280" rx="268" ry="268" fill="none" stroke="url(#ring-glow)" strokeWidth="4" />
          </svg>
        </div>

        {/* Main ring — crisp */}
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: 560,
            height: 560,
            marginTop: -280,
            marginLeft: -280,
            animation: "saturn-drift 14s ease-in-out infinite",
            transformStyle: "preserve-3d",
          }}
        >
          <svg viewBox="0 0 560 560" fill="none" className="w-full h-full">
            <defs>
              <linearGradient id="ring-main" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="rgba(168,85,247,0)" />
                <stop offset="15%" stopColor="rgba(168,85,247,0.3)" />
                <stop offset="35%" stopColor="rgba(168,85,247,0.6)" />
                <stop offset="50%" stopColor="rgba(139,92,246,0.8)" />
                <stop offset="65%" stopColor="rgba(99,102,241,0.6)" />
                <stop offset="85%" stopColor="rgba(99,102,241,0.3)" />
                <stop offset="100%" stopColor="rgba(99,102,241,0)" />
              </linearGradient>
            </defs>
            <ellipse cx="280" cy="280" rx="268" ry="268" fill="none" stroke="url(#ring-main)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Inner ring — thinner, offset timing */}
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: 500,
            height: 500,
            marginTop: -250,
            marginLeft: -250,
            animation: "saturn-drift 14s ease-in-out infinite 2s",
            transformStyle: "preserve-3d",
          }}
        >
          <svg viewBox="0 0 500 500" fill="none" className="w-full h-full">
            <defs>
              <linearGradient id="ring-inner" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="rgba(139,92,246,0)" />
                <stop offset="25%" stopColor="rgba(139,92,246,0.2)" />
                <stop offset="50%" stopColor="rgba(168,85,247,0.4)" />
                <stop offset="75%" stopColor="rgba(236,72,153,0.2)" />
                <stop offset="100%" stopColor="rgba(236,72,153,0)" />
              </linearGradient>
            </defs>
            <ellipse cx="250" cy="250" rx="240" ry="240" fill="none" stroke="url(#ring-inner)" strokeWidth="1" />
          </svg>
        </div>

        {/* Particle dots on ring path */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4,
              height: 4,
              background: i % 2 === 0 ? "rgba(168,85,247,0.7)" : "rgba(99,102,241,0.6)",
              boxShadow: `0 0 8px ${i % 2 === 0 ? "rgba(168,85,247,0.5)" : "rgba(99,102,241,0.4)"}`,
              top: "50%",
              left: "50%",
              animation: `saturn-drift 14s ease-in-out infinite ${i * 3.5}s`,
              transform: `translate(-50%, -50%) rotate(${i * 90 + 20}deg) translateX(268px)`,
            }}
          />
        ))}
      </div>

      {/* Phone frame with 3D perspective */}
      <div
        className="relative"
        style={{
          transform: "perspective(300px) rotateY(-6deg) rotateX(2deg) translateX(-30px)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Phone body */}
        <div
          className="relative"
          style={{
            background: "linear-gradient(145deg, #2a2a3a 0%, #1a1a28 40%, #0e0e18 100%)",
            borderRadius: 44,
            padding: "10px 7px 10px 7px",
            boxShadow: `
              0 50px 100px rgba(0,0,0,0.5),
              0 20px 60px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.08),
              inset 0 -1px 0 rgba(0,0,0,0.3),
              -4px 0 8px rgba(0,0,0,0.2),
              4px 0 8px rgba(0,0,0,0.15)
            `,
          }}
        >
          {/* Side buttons — volume */}
          <div
            className="absolute"
            style={{
              left: -2.5,
              top: 100,
              width: 3,
              height: 28,
              borderRadius: "3px 0 0 3px",
              background: "linear-gradient(180deg, #2a2a3a, #1a1a28)",
              boxShadow: "-1px 0 2px rgba(0,0,0,0.3)",
            }}
          />
          <div
            className="absolute"
            style={{
              left: -2.5,
              top: 138,
              width: 3,
              height: 28,
              borderRadius: "3px 0 0 3px",
              background: "linear-gradient(180deg, #2a2a3a, #1a1a28)",
              boxShadow: "-1px 0 2px rgba(0,0,0,0.3)",
            }}
          />
          {/* Side button — power */}
          <div
            className="absolute"
            style={{
              right: -2.5,
              top: 120,
              width: 3,
              height: 40,
              borderRadius: "0 3px 3px 0",
              background: "linear-gradient(180deg, #2a2a3a, #1a1a28)",
              boxShadow: "1px 0 2px rgba(0,0,0,0.3)",
            }}
          />

          {/* Screen */}
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: 38,
              background: wa.bg,
            }}
          >
            {/* Status bar */}
            <div
              className="flex items-center justify-between px-6 pt-3 pb-1"
              style={{ background: wa.header }}
            >
              <span className="text-[12px] font-semibold" style={{ color: wa.text }}>
                10:42
              </span>
              <div className="flex items-center gap-1.5">
                {/* Signal bars */}
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <rect x="0" y="8" width="3" height="4" rx="0.5" fill={wa.text} />
                  <rect x="4" y="5" width="3" height="7" rx="0.5" fill={wa.text} />
                  <rect x="8" y="2" width="3" height="10" rx="0.5" fill={wa.text} />
                  <rect x="12" y="0" width="3" height="12" rx="0.5" fill={wa.text} opacity="0.3" />
                </svg>
                {/* WiFi */}
                <svg width="14" height="11" viewBox="0 0 14 11" fill={wa.text}>
                  <path d="M7 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM3.05 7.54a5.5 5.5 0 017.9 0l-.9.9a4.13 4.13 0 00-6.1 0l-.9-.9zM.58 5.07a9.14 9.14 0 0112.84 0l-.9.9a7.76 7.76 0 00-11.04 0l-.9-.9z" />
                </svg>
                {/* Battery */}
                <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                  <rect x="0.5" y="0.5" width="20" height="11" rx="2" stroke={wa.text} strokeOpacity="0.4" />
                  <rect x="21.5" y="3.5" width="2" height="5" rx="1" fill={wa.text} fillOpacity="0.4" />
                  <rect x="2" y="2" width="14" height="8" rx="1" fill={wa.green} />
                </svg>
              </div>
            </div>

            {/* ── WhatsApp Header ── */}
            <div
              className="flex items-center gap-3 px-3 py-2"
              style={{ background: wa.header }}
            >
              <ChevronLeft className="w-5 h-5 flex-shrink-0" style={{ color: wa.textSec }} />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[13px] font-medium" style={{ color: wa.text }}>
                    Adhikaar Agent
                  </span>
                  <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: wa.green }} />
                </div>
                <div className="text-[10px]" style={{ color: wa.textSec }}>
                  online
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <Video className="w-4 h-4" style={{ color: wa.textSec }} />
                <Phone className="w-4 h-4" style={{ color: wa.textSec }} />
                <MoreVertical className="w-4 h-4" style={{ color: wa.textSec }} />
              </div>
            </div>

            {/* ── Chat Area ── */}
            <div
              className="px-2.5 py-2.5 space-y-2"
              style={{
                minHeight: 300,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {/* Encryption notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center justify-center gap-1.5 mx-auto px-3 py-1 rounded-lg text-center"
                style={{ background: "rgba(255,255,255,0.04)", maxWidth: 260 }}
              >
                <Lock className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "#FFD279" }} />
                <span className="text-[9px] leading-tight" style={{ color: "#FFD27980" }}>
                  Messages are end-to-end encrypted
                </span>
              </motion.div>

              {/* Bot message 1 — greeting */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.35 }}
                className="flex justify-start"
              >
                <div
                  className="relative px-2.5 py-1.5 rounded-lg rounded-tl-sm max-w-[85%]"
                  style={{ background: wa.bubbleIn }}
                >
                  <p className="text-[11.5px] leading-relaxed" style={{ color: wa.text }}>
                    🙏 नमस्ते! मैं <span className="font-semibold">अधिकार AI</span> हूँ।
                    <br />
                    अपने बारे में बताइए — राज्य, पेशा, आय?
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[9px]" style={{ color: wa.textSec }}>10:42 am</span>
                  </div>
                </div>
              </motion.div>

              {/* User voice note */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.35 }}
                className="flex justify-end"
              >
                <div
                  className="relative px-2 py-1.5 rounded-lg rounded-tr-sm max-w-[78%]"
                  style={{ background: wa.bubbleOut }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                      <Play className="w-2.5 h-2.5 text-white ml-0.5" />
                    </div>
                    <VoiceNoteWaveform />
                    <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}>
                      0:12
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-0.5 mt-0.5">
                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>10:42 am</span>
                    <BlueTicks />
                  </div>
                </div>
              </motion.div>

              {/* Transcription bubble */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2, duration: 0.35 }}
                className="flex justify-start"
              >
                <div
                  className="relative px-2.5 py-1.5 rounded-lg rounded-tl-sm max-w-[85%]"
                  style={{ background: wa.bubbleIn }}
                >
                  <p className="text-[9px] italic mb-1" style={{ color: wa.textSec }}>
                    🎙️ &quot;मैं UP से हूँ, किसान हूँ, income 80,000&quot;
                  </p>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: wa.text }}>
                    ✅ आपकी <span className="font-bold" style={{ color: wa.green }}>5 योजनाएँ</span> मिलीं!
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[9px]" style={{ color: wa.textSec }}>10:43 am</span>
                  </div>
                </div>
              </motion.div>

              {/* Scheme cards */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.0, duration: 0.35 }}
                className="flex justify-start"
              >
                <div
                  className="relative rounded-lg rounded-tl-sm max-w-[85%] overflow-hidden"
                  style={{ background: wa.bubbleIn }}
                >
                  <div className="px-2 py-1.5 space-y-1">
                    {[
                      { name: "PM-KISAN", match: "95%", benefit: "₹6,000/yr", emoji: "🌾" },
                      { name: "Ayushman Bharat", match: "92%", benefit: "₹5L coverage", emoji: "🏥" },
                      { name: "PM Awas Yojana", match: "87%", benefit: "₹1.2L grant", emoji: "🏠" },
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 3.2 + i * 0.2, duration: 0.25 }}
                        className="flex items-center gap-2 px-2 py-1 rounded-md"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        <span className="text-xs">{s.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold" style={{ color: wa.text }}>{s.name}</div>
                          <div className="text-[9px]" style={{ color: wa.textSec }}>{s.benefit}</div>
                        </div>
                        <div
                          className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(0,168,132,0.15)", color: wa.green }}
                        >
                          {s.match}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex items-center justify-end gap-1 px-2.5 pb-1">
                    <span className="text-[9px]" style={{ color: wa.textSec }}>10:43 am</span>
                  </div>
                  {/* WhatsApp-style reply buttons */}
                  <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 4.0, duration: 0.3 }}
                      className="w-full py-1.5 text-[12px] font-medium flex items-center justify-center gap-1.5"
                      style={{ color: wa.green }}
                    >
                      <Zap className="w-3 h-3" />
                      Apply Now — PM-KISAN
                    </motion.button>
                  </div>
                  <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 4.2, duration: 0.3 }}
                      className="w-full py-1.5 text-[12px] font-medium flex items-center justify-center gap-1.5"
                      style={{ color: wa.green }}
                    >
                      See All 5 Schemes
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── WhatsApp Input Bar ── */}
            <div className="flex items-end gap-1.5 px-2 py-1.5" style={{ background: wa.bg }}>
              <div
                className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-3xl"
                style={{ background: wa.inputBg }}
              >
                <Smile className="w-4 h-4 flex-shrink-0" style={{ color: wa.textSec }} />
                <span className="text-[12px] flex-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Type a message
                </span>
                <Paperclip className="w-4 h-4 flex-shrink-0 rotate-[-45deg]" style={{ color: wa.textSec }} />
                <Camera className="w-4 h-4 flex-shrink-0" style={{ color: wa.textSec }} />
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: wa.green }}
              >
                <Mic className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Home indicator */}
            <div className="flex justify-center py-2" style={{ background: wa.bg }}>
              <div className="w-28 h-1 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Voice waveform (hero section) ──────────────── */

function VoiceWaveform() {
  return (
    <div className="flex items-end justify-center gap-[3px] h-6">
      {[12, 22, 8, 18, 28, 10, 20, 6, 16, 26].map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-purple-500/60 to-indigo-400/60"
          style={{
            animation: `voice-bar 0.8s ease-in-out ${i * 0.07}s infinite`,
            ["--bar-h" as string]: `${h}px`,
            height: "4px",
          }}
        />
      ))}
    </div>
  );
}

/* ── Data ────────────────────────────────────────── */

const techStack = [
  { label: "Voice", value: "Sarvam AI", color: "text-purple-400" },
  { label: "LLM", value: "Groq Llama 3.3", color: "text-blue-400" },
  { label: "Realtime", value: "LiveKit", color: "text-cyan-400" },
  { label: "Automation", value: "Playwright", color: "text-amber-400" },
  { label: "Data", value: "DPI Infra", color: "text-emerald-400" },
];

const integrations = [
  { link: "#", text: "API Setu", image: "/integrations/img-blue-tech.jpg" },
  { link: "#", text: "DigiLocker", image: "/integrations/img-circuit.jpg" },
  { link: "#", text: "Aadhaar / UIDAI", image: "/integrations/aadhaar.png" },
  { link: "#", text: "UPI / NPCI", image: "/integrations/upi.png" },
  { link: "#", text: "UMANG", image: "/integrations/img-network.jpg" },
  { link: "#", text: "e-Sign", image: "/integrations/img-crypto.jpg" },
  { link: "#", text: "Ayushman Bharat", image: "/integrations/img-abstract.jpg" },
  { link: "#", text: "IndiaStack", image: "/integrations/img-matrix.jpg" },
];

const features = [
  {
    icon: Mic,
    title: "Voice-First, Zero Barriers",
    description: "Speak in Hindi or English. No forms, no apps, no literacy required. Just talk — Adhikaar listens and understands.",
    hindi: "बस बोलिए, अधिकार सुनेगा",
    accent: "text-purple-400",
    accentBg: "bg-purple-500/10",
    spotlightColor: "rgba(168, 85, 247, 0.12)",
    size: "large",
  },
  {
    icon: MonitorPlay,
    title: "Live Web Automation",
    description: "Watch as Playwright opens government portals and fills your application form autonomously. You just watch.",
    hindi: "फॉर्म अपने आप भरेगा",
    accent: "text-amber-400",
    accentBg: "bg-amber-500/10",
    spotlightColor: "rgba(245, 158, 11, 0.12)",
    size: "large",
  },
  {
    icon: Bot,
    title: "Autonomous Agent",
    description: "AI interviews you, finds matching schemes, collects documents, and auto-applies.",
    hindi: "AI खुद आवेदन भरेगा",
    accent: "text-blue-400",
    accentBg: "bg-blue-500/10",
    spotlightColor: "rgba(96, 165, 250, 0.12)",
    size: "small",
  },
  {
    icon: Shield,
    title: "50+ Real Schemes",
    description: "PM-KISAN, Ayushman Bharat, PM Awas Yojana — with real eligibility matching.",
    hindi: "असली योजनाएँ",
    accent: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    spotlightColor: "rgba(52, 211, 153, 0.12)",
    size: "small",
  },
  {
    icon: FileCheck,
    title: "Document Intelligence",
    description: "Auto-identifies, validates, and attaches required documents to your application.",
    hindi: "दस्तावेज़ खुद जोड़ेगा",
    accent: "text-pink-400",
    accentBg: "bg-pink-500/10",
    spotlightColor: "rgba(244, 114, 182, 0.12)",
    size: "small",
  },
  {
    icon: Languages,
    title: "10+ Indian Languages",
    description: "Powered by Sarvam AI for natural Indian language voice — not robotic TTS.",
    hindi: "आपकी भाषा",
    accent: "text-cyan-400",
    accentBg: "bg-cyan-500/10",
    spotlightColor: "rgba(34, 211, 238, 0.12)",
    size: "small",
  },
];

const steps = [
  {
    num: "01",
    icon: Mic,
    title: "Speak Your Situation",
    description: "Tell the agent about yourself — state, occupation, income. In any language.",
    visual: "🎙️ \"मैं UP से हूँ, किसान हूँ\"",
    accent: "from-purple-500/20 to-indigo-500/20",
    accentText: "text-purple-400",
  },
  {
    num: "02",
    icon: Zap,
    title: "Get Matched Instantly",
    description: "AI identifies 5-10 schemes you're eligible for with match scores.",
    visual: "PM-KISAN 95% • Ayushman 92% • PMAY 87%",
    accent: "from-blue-500/20 to-cyan-500/20",
    accentText: "text-blue-400",
  },
  {
    num: "03",
    icon: FileCheck,
    title: "Upload Documents",
    description: "Aadhaar, income certificate, land record — or fetch from DigiLocker.",
    visual: "Aadhaar ✓ • Income Cert ✓ • Land Record ✓",
    accent: "from-amber-500/20 to-orange-500/20",
    accentText: "text-amber-400",
  },
  {
    num: "04",
    icon: MonitorPlay,
    title: "Agent Applies For You",
    description: "Watch the AI open government portals and fill your forms live.",
    visual: "Ref: PMKISAN-2026-847291 ✓",
    accent: "from-emerald-500/20 to-green-500/20",
    accentText: "text-emerald-400",
  },
];

/* ── Timeline with scroll progress ──────────────── */

function TimelineProgress({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.5"],
  });

  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.7, 1]);

  return (
    <div className="relative max-w-3xl mx-auto" ref={containerRef}>
      {/* Track — dim background line (behind cards) */}
      <div
        className="absolute left-8 sm:left-10 top-0 bottom-0 w-[6px] hidden sm:block z-0"
        style={{
          background: "rgba(168,85,247,0.08)",
        }}
      />

      {/* Progress fill — lights up as you scroll (behind cards) */}
      <motion.div
        className="absolute left-8 sm:left-10 top-0 w-[2px] hidden sm:block z-0 origin-top"
        style={{
          scaleY,
          height: "100%",
          background: "linear-gradient(to bottom, rgba(168,85,247,0.6), rgba(139,92,246,0.5), rgba(99,102,241,0.4))",
          boxShadow: "0 0 8px rgba(168,85,247,0.4), 0 0 20px rgba(168,85,247,0.15)",
        }}
      />

      {/* Glowing dot at progress tip */}
      <motion.div
        className="absolute left-8 sm:left-10 w-[10px] h-[10px] rounded-full hidden sm:block z-0"
        style={{
          y: useTransform(scrollYProgress, [0, 1], ["0%", "90%"]),
          top: 0,
          marginLeft: -2,
          background: "rgba(168,85,247,0.9)",
          boxShadow: "0 0 10px rgba(168,85,247,0.8), 0 0 25px rgba(168,85,247,0.4)",
          opacity: glowOpacity,
        }}
      />

      <div className="relative z-10 pl-16 sm:pl-28">
        {children}
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────── */

export default function Hero() {
  return (
    <ClickSpark sparkColor="#a78bfa" sparkSize={12} sparkRadius={20} duration={500}>
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 tech-grid opacity-75" />
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,1) 0%, transparent 70%)",
            top: "-20%",
            left: "30%",
            animation: "float-slow 16s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,1) 0%, transparent 70%)",
            top: "60%",
            right: "-5%",
            animation: "float 12s ease-in-out infinite 3s",
          }}
        />

        {/* ══ SECTION 1 — HERO ══ */}
        <section className="relative pt-28 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass text-xs text-muted-foreground mb-6"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Right to Welfare LIVE
              </motion.div>

              {/* ★ BlurText heading */}
              <BlurText
                text="Your Welfare Rights,"
                delay={80}
                animateBy="words"
                direction="bottom"
                className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-display)] tracking-tight leading-[1.05]"
              />
              <ShinyText
                text="Automated."
                speed={3}
                color="#c084fc"
                shineColor="#e9d5ff"
                className="text-4xl sm:text-5xl lg:text-6xl font-bold font-[family-name:var(--font-display)] tracking-tight leading-[1.05] mb-6"
              />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-base sm:text-lg text-muted-foreground/80 max-w-lg mb-4 leading-relaxed"
              >
                Voice-based AI agent that helps any Indian citizen discover, match,
                and apply for government schemes — in under 3 minutes.
              </motion.p>

              {/* ★ DecryptedText Hindi tagline */}
              <div className="mb-8">
                <DecryptedText
                  text="अधिकार — आपके अधिकार, AI की ताकत"
                  speed={40}
                  sequential
                  animateOn="view"
                  revealDirection="center"
                  className="text-purple-300/50"
                  encryptedClassName="text-purple-500/30"
                  parentClassName="text-sm font-[family-name:var(--font-display)]"
                />
              </div>

              {/* ★ Magnet CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap gap-3 mb-8"
              >
                <Magnet padding={60} magnetStrength={3}>
                  <Link
                    href="/chat"
                    className="group flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-xl shadow-purple-500/15 hover:shadow-purple-500/30 hover:scale-[1.02] glow-cta"
                  >
                    <Mic className="w-5 h-5" />
                    Talk to Adhikaar
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Magnet>
                <Link
                  href="/schemes"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass text-foreground/80 font-medium hover:glass-strong transition-all"
                >
                  <Globe className="w-4 h-4 text-muted-foreground/50" />
                  Explore Schemes
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <VoiceWaveform />
              </motion.div>
            </div>

            {/* Right — Product Demo */}
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block translate-x-16"
            >
              <HeroChatDemo />
            </motion.div>
          </div>
        </section>

        {/* ══ SCROLL VELOCITY MARQUEE ══ */}
        <div className="py-6 select-none pointer-events-none border-y border-white/[0.03]">
          <ScrollVelocity
            texts={["ADHIKAAR • अधिकार • WELFARE RIGHTS • सरकारी योजनाएँ •", "PM-KISAN • AYUSHMAN BHARAT • PM AWAS • MUDRA YOJANA •"]}
            velocity={40}
            className="text-2xl md:text-4xl font-bold font-[family-name:var(--font-display)] text-purple-400/[0.12]"
          />
        </div>

        {/* ══ SECTION 2 — STATS BAND ══ */}
        <section className="relative py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8"
            >
              {[
                { value: 400, suffix: "+", label: "Government Schemes", color: "text-purple-400" },
                { value: 7, suffix: ".5L Cr", label: "Annual Welfare Budget", color: "text-emerald-400" },
                { value: 40, suffix: "%", label: "Benefits Go Unclaimed", color: "text-amber-400" },
                { value: 3, suffix: " min", label: "Apply With Adhikaar", color: "text-blue-400" },
              ].map((stat, i) => (
                <div key={i} className="text-center px-4 py-5 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                  <div className={cn("text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] tabular-nums", stat.color)}>
                    {/* ★ CountUp from ReactBits */}
                    <CountUp to={stat.value} duration={2} delay={0.2 * i} separator="," />
                    {stat.suffix}
                  </div>
                  <div className="text-xs text-muted-foreground/40 mt-2 uppercase tracking-wider font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ══ SECTION 3 — HOW IT WORKS ══ */}
        <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Section header — centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-primary/40 mb-4">
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-4 leading-tight">
              From voice to{" "}
              <GradientText>submitted application</GradientText>
            </h2>
            <p className="text-muted-foreground/70 max-w-xl mx-auto leading-relaxed">
              Adhikaar handles the entire process autonomously. You speak, it listens, matches, and applies — in under 3 minutes.
            </p>
          </motion.div>

          {/* Timeline */}
          <TimelineProgress>
            <div className="space-y-4 sm:space-y-6">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <SpotlightCard
                    className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 sm:p-6"
                    spotlightColor="rgba(168, 85, 247, 0.08)"
                  >
                    <div className="flex gap-4 sm:gap-5">
                      {/* Step icon + number */}
                      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${step.accent} flex flex-col items-center justify-center border border-white/[0.04]`}>
                          <step.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${step.accentText} mb-1`} />
                          <span className={`text-[10px] font-bold font-mono ${step.accentText} opacity-60`}>
                            {step.num}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 py-1">
                        <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground/60 mb-3 leading-relaxed">
                          {step.description}
                        </p>
                        <div className="text-xs font-mono text-purple-300/40 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.03] inline-block">
                          {step.visual}
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center mt-10"
            >
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline underline-offset-4"
              >
                Try it now <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </TimelineProgress>
        </section>

        {/* ══ SECTION 4 — FEATURES (Bento Grid with SpotlightCards) ══ */}
        <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-primary/40 mb-4">
              Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-4">
              Not another chatbot.{" "}
              <GradientText>An autonomous agent.</GradientText>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {features
              .filter((f) => f.size === "large")
              .map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  {/* ★ SpotlightCard on features */}
                  <SpotlightCard
                    className="h-full min-h-[200px] rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 sm:p-6 group"
                    spotlightColor={feature.spotlightColor}
                  >
                    <div className={`w-12 h-12 rounded-xl ${feature.accentBg} flex items-center justify-center mb-5 transition-transform group-hover:scale-110`}>
                      <feature.icon className={`w-6 h-6 ${feature.accent}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 font-[family-name:var(--font-display)]">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground/70 mb-4 leading-relaxed max-w-sm">
                      {feature.description}
                    </p>
                    <p className="text-xs text-purple-300/35 font-medium">
                      {feature.hindi}
                    </p>
                  </SpotlightCard>
                </motion.div>
              ))}

            <div className="md:col-span-2 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features
                .filter((f) => f.size === "small")
                .map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  >
                    <SpotlightCard
                      className="h-full rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 sm:p-6 group"
                      spotlightColor={feature.spotlightColor}
                    >
                      <div className={`w-10 h-10 rounded-xl ${feature.accentBg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                        <feature.icon className={`w-5 h-5 ${feature.accent}`} />
                      </div>
                      <h3 className="text-sm font-semibold mb-1.5 font-[family-name:var(--font-display)]">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground/60 leading-relaxed">
                        {feature.description}
                      </p>
                    </SpotlightCard>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>

        {/* ══ SECTION 4.5 — DPI / GOVT INTEGRATIONS ══ */}
        <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-primary/40 mb-4">
              Integrations
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-4">
              Pluggable into{" "}
              <GradientText>India&apos;s Digital Backbone.</GradientText>
            </h2>
            <p className="text-sm text-muted-foreground/50 max-w-xl">
              Adhikaar connects directly to DPI rails and government APIs —
              enabling real-time verification, document fetch, and end-to-end
              automation.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-2xl overflow-hidden border border-white/[0.06]"
            style={{ height: "700px" }}
          >
            <FlowingMenu
              items={integrations}
              speed={12}
              textColor="rgba(255,255,255,0.7)"
              bgColor="rgba(255,255,255,0.02)"
              marqueeBgColor="rgba(168,85,247,0.85)"
              marqueeTextColor="#ffffff"
              borderColor="rgba(255,255,255,0.04)"
            />
          </motion.div>
        </section>

        {/* ══ SECTION 5 — TECH STACK ══ */}
        <section className="relative py-20 border-y border-white/[0.03]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="font-mono text-xs uppercase tracking-[0.25em] text-primary/40 text-center mb-4">
                Built With
              </div>
              <p className="text-center text-sm text-muted-foreground/40 mb-10 max-w-md mx-auto">
                India-first AI stack — voice, language, and automation built for Bharat
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {techStack.map((tech, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                  >
                    <div className={cn("text-sm font-semibold font-[family-name:var(--font-display)]", tech.color)}>
                      {tech.value}
                    </div>
                    <div className="w-px h-4 bg-white/[0.06]" />
                    <div className="text-[10px] text-muted-foreground/30 uppercase tracking-wider">
                      {tech.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══ SECTION FAQ ══ */}
        <section className="py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <FaqSection
              title="Common Questions"
              subtitle="Everything you need to know about how Adhikaar helps you access government welfare schemes."
              badge="FAQ"
              image="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=830&h=844&auto=format&fit=crop"
              faqs={[
                {
                  question: "What languages does Adhikaar support?",
                  answer:
                    "Adhikaar currently supports Hindi and English, with more Indian regional languages coming soon. You can switch languages at any time during your conversation with the AI agent.",
                },
                {
                  question: "How does Adhikaar find schemes I'm eligible for?",
                  answer:
                    "Adhikaar interviews you about your profile (income, occupation, state, family details) and cross-references it against real-time data from myScheme.gov.in and other government databases to find schemes where you qualify.",
                },
                {
                  question: "Does Adhikaar actually submit applications on my behalf?",
                  answer:
                    "Yes! Once you've confirmed your eligibility and gathered the required documents, Adhikaar can autonomously fill and submit the application form using web-automation — no paperwork or portal navigation needed.",
                },
                {
                  question: "Is my personal data secure?",
                  answer:
                    "All data is handled with end-to-end encryption. We do not store sensitive personal information like Aadhaar numbers or bank details beyond what is needed to fill your application, and we follow government data security guidelines.",
                },
                {
                  question: "What if I don't have documents ready?",
                  answer:
                    "Adhikaar will give you a precise checklist of exactly which documents are needed for each scheme and guide you on how to obtain any missing ones from your local government office.",
                },
              ]}
            />
          </motion.div>
        </section>

        {/* ══ SECTION 6 — CTA ══ */}
        <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-5 leading-tight">
                Ready to claim your{" "}
                <GradientText>rights</GradientText>?
              </h2>
              <p className="text-muted-foreground/70 mb-10 max-w-lg mx-auto leading-relaxed text-lg">
                Speak in your language. Discover schemes. Apply in 3 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Magnet padding={80} magnetStrength={2}>
                  <Link
                    href="/chat"
                    className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-lg hover:from-purple-500 hover:to-indigo-500 transition-all shadow-xl shadow-purple-500/15 hover:shadow-purple-500/30 hover:scale-[1.02] glow-cta"
                  >
                    <Mic className="w-5 h-5" />
                    Start Talking Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Magnet>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glass text-foreground/70 font-medium hover:glass-strong transition-all"
                >
                  View Dashboard
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/[0.03] py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Mic className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold font-[family-name:var(--font-display)] gradient-text">
                  Adhikaar
                </span>
                <span className="text-muted-foreground/30 text-xs">
                  by Syntrix
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-muted-foreground/20 font-mono tracking-wider">
                  Made with ❤️ by Team SYNTRIX
                </span>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-white/[0.03] text-center">
              <p className="text-[11px] text-muted-foreground/20">
                Built with DPI Infra. + Sarvam AI + LiveKit + Playwright
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ClickSpark>
  );
}
