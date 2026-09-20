"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Heart,
  Building2,
  GraduationCap,
  Briefcase,
  Home,
  Stethoscope,
  Wheat,
  Users,
  Shield,
  Banknote,
  Wrench,
  TreePine,
  Building,
  ArrowRight,
  Mic,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import GlassCard from "@/components/shared/GlassCard";
import Navbar from "@/components/shared/Navbar";
import PageShell from "@/components/shared/PageShell";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import Magnet from "@/components/reactbits/Magnet";
import type { SchemeCategory, Scheme } from "@/lib/types";
import schemesData from "@/data/schemes.json";

const categoryConfig: Record<
  SchemeCategory,
  { icon: typeof Heart; label: string; color: string; bg: string }
> = {
  agriculture: { icon: Wheat, label: "Agriculture", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  housing: { icon: Home, label: "Housing", color: "text-amber-400", bg: "bg-amber-500/10" },
  healthcare: { icon: Stethoscope, label: "Healthcare", color: "text-red-400", bg: "bg-red-500/10" },
  education: { icon: GraduationCap, label: "Education", color: "text-blue-400", bg: "bg-blue-500/10" },
  employment: { icon: Briefcase, label: "Employment", color: "text-orange-400", bg: "bg-orange-500/10" },
  women: { icon: Users, label: "Women & Child", color: "text-pink-400", bg: "bg-pink-500/10" },
  "social-security": { icon: Shield, label: "Social Security", color: "text-purple-400", bg: "bg-purple-500/10" },
  financial: { icon: Banknote, label: "Financial", color: "text-green-400", bg: "bg-green-500/10" },
  "skill-development": { icon: Wrench, label: "Skill Dev", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  rural: { icon: TreePine, label: "Rural", color: "text-lime-400", bg: "bg-lime-500/10" },
  urban: { icon: Building, label: "Urban", color: "text-slate-400", bg: "bg-slate-500/10" },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

/* ── Scheme Detail Modal ─────────────────────────── */

function SchemeModal({
  scheme,
  onClose,
}: {
  scheme: Scheme;
  onClose: () => void;
}) {
  const config =
    categoryConfig[scheme.category as SchemeCategory] || {
      icon: Building2,
      label: scheme.category,
      color: "text-primary",
      bg: "bg-primary/10",
    };
  const CatIcon = config.icon;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full"
      >
        <GlassCard glow className="p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                <CatIcon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <h3 className="font-semibold font-[family-name:var(--font-display)] text-lg">
                  {scheme.name}
                </h3>
                <p className="text-xs text-purple-300/50">
                  {scheme.nameHindi}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {scheme.description}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-xl p-3">
                <div className="text-xs text-muted-foreground/60 mb-1 font-mono uppercase tracking-wider">
                  Max Benefit
                </div>
                <div className="text-sm font-semibold text-emerald-400 font-mono">
                  {scheme.maxBenefit}
                </div>
              </div>
              <div className="glass rounded-xl p-3">
                <div className="text-xs text-muted-foreground/60 mb-1 font-mono uppercase tracking-wider">
                  Category
                </div>
                <div className={`text-sm font-semibold ${config.color}`}>
                  {config.label}
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-3">
              <div className="text-xs text-muted-foreground/60 mb-1 font-mono uppercase tracking-wider">
                Ministry
              </div>
              <div className="text-sm">{scheme.ministry}</div>
            </div>

            {scheme.eligibility && (
              <div className="glass rounded-xl p-3">
                <div className="text-xs text-muted-foreground/60 mb-2 font-mono uppercase tracking-wider">
                  Eligibility
                </div>
                <div className="space-y-1.5 text-xs">
                  {scheme.eligibility.minAge && (
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                      Age: {scheme.eligibility.minAge}
                      {scheme.eligibility.maxAge
                        ? ` - ${scheme.eligibility.maxAge}`
                        : "+"}{" "}
                      years
                    </div>
                  )}
                  {scheme.eligibility.gender &&
                    scheme.eligibility.gender !== "any" && (
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                        Gender: {scheme.eligibility.gender}
                      </div>
                    )}
                  {scheme.eligibility.maxIncome && (
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                      Income: up to ₹
                      {scheme.eligibility.maxIncome.toLocaleString()}/year
                    </div>
                  )}
                  {scheme.eligibility.occupation &&
                    scheme.eligibility.occupation.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                        Occupation:{" "}
                        {scheme.eligibility.occupation.join(", ")}
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/[0.04]">
            <Magnet padding={50} magnetStrength={3}>
              <Link
                href="/chat"
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/15 hover:shadow-purple-500/30"
              >
                <Mic className="w-4 h-4" />
                Check My Eligibility
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Magnet>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Page ───────────────────────────────────── */

export default function SchemesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    SchemeCategory | "all"
  >("all");
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  const schemes = schemesData as Scheme[];

  const categories: (SchemeCategory | "all")[] = [
    "all",
    ...(Object.keys(categoryConfig) as SchemeCategory[]),
  ];

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: schemes.length };
    for (const s of schemes) {
      counts[s.category] = (counts[s.category] || 0) + 1;
    }
    return counts;
  }, [schemes]);

  const filtered = useMemo(() => {
    return schemes.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.nameHindi?.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === "all" || s.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [search, selectedCategory, schemes]);

  return (
    <>
      <Navbar />
      <PageShell>
        <main className="pt-36 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-primary/50 mb-3">
              Scheme Explorer
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-3">
              Government Schemes
            </h1>
            <p className="text-muted-foreground text-lg">
              Browse {schemes.length} central and state welfare schemes
            </p>
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, keyword, or Hindi..."
                className="w-full pl-11 pr-10 py-3 rounded-xl glass-elevated border-none bg-transparent text-sm placeholder:text-muted-foreground/30 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/[0.04] text-muted-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground glass-elevated rounded-xl px-4 py-3">
              <Filter className="w-4 h-4 text-primary/50" />
              <span className="font-mono text-foreground">
                {filtered.length}
              </span>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-mono text-muted-foreground/60">
                {schemes.length}
              </span>
            </div>
          </motion.div>

          {/* Split Layout: Sidebar + Content */}
          <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">

            {/* Desktop Sidebar — Category Filters */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="hidden lg:block lg:sticky lg:top-24"
            >
              <GlassCard className="p-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30 mb-3 px-3 pt-2">
                  Categories
                </div>
                <div className="space-y-0.5">
                  {categories.map((cat) => {
                    const sc =
                      cat === "all"
                        ? { icon: Building2, label: "All Schemes", color: "text-foreground", bg: "bg-primary/10" }
                        : categoryConfig[cat];
                    const SIcon = sc.icon;
                    const sCount = categoryCounts[cat] || 0;
                    const sActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left",
                          sActive
                            ? cn("glass", sc.color)
                            : "text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.02]"
                        )}
                      >
                        <SIcon
                          className={cn(
                            "w-4 h-4 flex-shrink-0",
                            sActive ? sc.color : "text-muted-foreground/40"
                          )}
                        />
                        <span className="flex-1 truncate">{sc.label}</span>
                        <span
                          className={cn(
                            "text-xs font-mono tabular-nums",
                            sActive ? "text-foreground/60" : "text-muted-foreground/30"
                          )}
                        >
                          {sCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.aside>

            {/* Main Content Area */}
            <div>

            {/* Category tabs — mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex lg:hidden gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide"
          >
            {categories.map((cat) => {
              const config = cat === "all"
                ? { icon: Building2, label: "All", color: "text-foreground", bg: "bg-primary/10" }
                : categoryConfig[cat];
              const Icon = config.icon;
              const count = categoryCounts[cat] || 0;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all cursor-pointer",
                    isActive
                      ? cn("neon-border", config.color)
                      : "text-muted-foreground/60 hover:text-foreground glass hover:glass-strong"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive && config.color)} />
                  {config.label}
                  <span
                    className={cn(
                      "text-xs font-mono px-1.5 py-0.5 rounded-full",
                      isActive
                        ? "bg-white/[0.06]"
                        : "bg-white/[0.02]"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </motion.div>

          {/* Scheme grid */}
          <motion.div
            key={selectedCategory + search}
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid sm:grid-cols-2 gap-4"
          >
            {filtered.map((scheme) => {
              const config =
                categoryConfig[scheme.category as SchemeCategory] || {
                  icon: Building2,
                  label: scheme.category,
                  color: "text-primary",
                  bg: "bg-primary/10",
                };
              const CatIcon = config.icon;
              return (
                <motion.div
                  key={scheme.id}
                  variants={staggerItem}
                  layout
                >
                  <SpotlightCard
                    className="glass rounded-2xl p-5 h-full flex flex-col border border-white/[0.04]"
                    spotlightColor={`rgba(${
                      config.color.includes("emerald") ? "52, 211, 153" :
                      config.color.includes("amber") ? "251, 191, 36" :
                      config.color.includes("red") ? "248, 113, 113" :
                      config.color.includes("blue") ? "96, 165, 250" :
                      config.color.includes("orange") ? "251, 146, 60" :
                      config.color.includes("pink") ? "244, 114, 182" :
                      config.color.includes("purple") ? "192, 132, 252" :
                      config.color.includes("green") ? "74, 222, 128" :
                      config.color.includes("cyan") ? "34, 211, 238" :
                      config.color.includes("lime") ? "163, 230, 53" :
                      "148, 163, 184"
                    }, 0.15)`}
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedScheme(scheme)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${config.bg} transition-transform group-hover:scale-110`}>
                          <CatIcon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full glass font-mono ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-base mb-0.5 font-[family-name:var(--font-display)]">
                        {scheme.name}
                      </h3>
                      {scheme.nameHindi && (
                        <p className="text-xs text-purple-300/40 mb-2">
                          {scheme.nameHindi}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2 leading-relaxed">
                        {scheme.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] mt-auto">
                      <span className="text-xs text-muted-foreground/50 truncate max-w-[60%]">
                        {scheme.ministry}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-emerald-400 font-mono">
                        {scheme.maxBenefit}
                      </span>
                    </div>
                  </SpotlightCard>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No schemes found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try a different search term or category
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
                className="text-sm text-primary hover:underline"
              >
                Clear filters
              </button>
            </motion.div>
          )}

            </div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-16 text-center"
          >
            <GlassCard glow className="max-w-xl mx-auto py-10">
              <h3 className="text-xl font-semibold font-[family-name:var(--font-display)] mb-2">
                Not sure which schemes apply?
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Let Adhikaar interview you and find matching schemes
                automatically.
              </p>
              <Magnet padding={60} magnetStrength={3}>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/15 hover:shadow-purple-500/30"
                >
                  <Mic className="w-4 h-4" />
                  Talk to Adhikaar
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Magnet>
            </GlassCard>
          </motion.div>
        </main>
      </PageShell>

      {/* Modal */}
      <AnimatePresence>
        {selectedScheme && (
          <SchemeModal
            scheme={selectedScheme}
            onClose={() => setSelectedScheme(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
