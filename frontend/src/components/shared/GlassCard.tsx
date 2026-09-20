import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-6 relative overflow-hidden",
        hover &&
          "card-shine hover:glass-strong hover:scale-[1.015] transition-all duration-300 cursor-pointer hover:shadow-[0_8px_30px_rgba(168,85,247,0.08)]",
        glow && "gradient-border animate-[glow-pulse_3s_ease-in-out_infinite]",
        className
      )}
    >
      {/* Top highlight edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      {/* Left accent line */}
      {glow && (
        <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-purple-400/30 to-transparent" />
      )}
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
