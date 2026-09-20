"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

export default function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={className}
    >
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 tech-grid opacity-20" />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,1) 0%, transparent 70%)",
            top: "5%",
            left: "60%",
            animation: "float-slow 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,1) 0%, transparent 70%)",
            bottom: "10%",
            left: "15%",
            animation: "float 10s ease-in-out infinite 3s",
          }}
        />
      </div>

      {children}

      {/* Bottom viewport fade — gradient from transparent to background color */}
      <div
        className="fixed bottom-0 left-0 right-0 pointer-events-none"
        style={{ zIndex: 40, height: "7rem" }}
        aria-hidden="true"
      >
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, oklch(0.06 0.015 280 / 0.4) 35%, oklch(0.06 0.015 280 / 0.8) 65%, oklch(0.06 0.015 280) 100%)",
          }}
        />
      </div>
    </motion.div>
  );
}
