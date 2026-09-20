"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Mic, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/schemes", label: "Schemes" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeIndex = navLinks.findIndex((link) => link.href === pathname);

  return (
    <nav className="fixed top-4 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        <div className="glass-elevated rounded-2xl overflow-hidden backdrop-blur-lg bg-background/4">
          {/* Gradient accent line at top */}
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

          <div className="flex items-center justify-between h-15 px-5 sm:px-6">
            <div className="flex items-center gap-8"> 
              {/* Logo — wordmark */}
              <Link href="/" className="flex items-baseline gap-2.5 group">
                <span className="text-xl font-bold font-[family-name:var(--font-display)] tracking-tight shimmer-text">
                  ADHIKAAR
                </span>
              </Link>

              {/* Desktop nav — flat links with animated pill */}
              <div
                className="hidden md:flex items-center gap-1"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {navLinks.map((link, index) => {
                  const isActive = activeIndex === index;
                  const isHovered = hoveredIndex === index;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onMouseEnter={() => setHoveredIndex(index)}
                      className={cn(
                        "relative z-10 px-4 py-1.5 text-sm font-medium transition-colors duration-200 rounded-full",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground/50 hover:text-foreground/80"
                      )}
                    >
                      {/* Active pill — slides between items */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-active-pill"
                          className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.06]"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}

                      {/* Hover highlight — separate from active pill */}
                      {isHovered && !isActive && (
                        <motion.div
                          layoutId="nav-hover-pill"
                          className="absolute inset-0 rounded-full bg-white/[0.04]"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 28,
                          }}
                        />
                      )}

                      <span className="relative z-10">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* CTA — hidden when already on chat */}
            {pathname !== "/chat" && (
              <div className="hidden md:block">
                <Link
                  href="/chat"
                  className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all overflow-hidden"
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 transition-all group-hover:from-purple-500 group-hover:to-indigo-500" />
                  {/* Shine sweep on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </div>
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-xl shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow" />
                  {/* Content */}
                  <Mic className="w-3.5 h-3.5 text-white relative z-10" />
                  <span className="text-white relative z-10">Start Talking</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/50 group-hover:text-white/90 group-hover:translate-x-0.5 transition-all relative z-10" />
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden glass-elevated rounded-2xl mt-2 p-2"
            >
              <div className="space-y-0.5">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      pathname === href
                        ? "bg-white/[0.06] text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
                    )}
                  >
                    {label}
                    {pathname === href && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
                    )}
                  </Link>
                ))}
              </div>

              {pathname !== "/chat" && (
                <div className="pt-2 px-1 pb-1 border-t border-white/[0.04] mt-1.5">
                  <Link
                    href="/chat"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/15"
                  >
                    <Mic className="w-4 h-4" />
                    Talk to Adhikaar
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
