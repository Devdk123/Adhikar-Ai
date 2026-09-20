import GlassCard from "@/components/shared/GlassCard";
import GradientText from "@/components/shared/GradientText";
import { Mic, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 tech-grid opacity-20" />
      </div>
      <GlassCard glow className="max-w-md w-full text-center py-14">
        <div className="text-8xl font-black font-[family-name:var(--font-display)] shimmer-text mb-6">
          404
        </div>
        <h1 className="text-xl font-semibold mb-2 font-[family-name:var(--font-display)]">
          Page <GradientText>Not Found</GradientText>
        </h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          This page doesn&apos;t exist. But we can help you find real government schemes.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl glass text-sm font-medium hover:glass-strong transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/15"
          >
            <Mic className="w-4 h-4" />
            Talk to Adhikaar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
