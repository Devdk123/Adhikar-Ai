"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  ArrowRight,
  Eye,
  Mic,
  TrendingUp,
  IndianRupee,
  FileCheck,
  Timer,
  Inbox,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import GlassCard from "@/components/shared/GlassCard";
import Navbar from "@/components/shared/Navbar";
import PageShell from "@/components/shared/PageShell";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import Magnet from "@/components/reactbits/Magnet";
import type { ApplicationStatus } from "@/lib/types";
import { getApplications, type StoredApplication } from "@/lib/applications";

const statusConfig: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string; icon: typeof CheckCircle2 }
> = {
  draft: { label: "Draft", color: "text-slate-400", bg: "bg-slate-400/10", icon: FileText },
  submitted: { label: "Submitted", color: "text-blue-400", bg: "bg-blue-400/10", icon: Clock },
  "under-review": { label: "Under Review", color: "text-amber-400", bg: "bg-amber-400/10", icon: Eye },
  verified: { label: "Verified", color: "text-purple-400", bg: "bg-purple-400/10", icon: CheckCircle2 },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-400/10", icon: AlertCircle },
  disbursed: { label: "Disbursed", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
};

const statusOrder: ApplicationStatus[] = [
  "submitted",
  "under-review",
  "verified",
  "approved",
  "disbursed",
];

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function DashboardPage() {
  const [applications, setApplications] = useState<StoredApplication[]>([]);

  // Load from store + listen for real-time updates
  useEffect(() => {
    setApplications(getApplications());

    const handler = () => setApplications(getApplications());
    window.addEventListener("adhikaar:application-update", handler);
    // Also re-read on focus (if user applied in chat tab then switches to dashboard)
    window.addEventListener("focus", handler);
    return () => {
      window.removeEventListener("adhikaar:application-update", handler);
      window.removeEventListener("focus", handler);
    };
  }, []);

  // Compute stats dynamically
  const stats = useMemo(() => {
    const total = applications.length;
    const underReview = applications.filter((a) => a.status === "under-review").length;
    const approved = applications.filter(
      (a) => a.status === "approved" || a.status === "verified" || a.status === "disbursed"
    ).length;

    // Estimate total benefits from benefit strings like "₹6,000/year" or "₹5,00,000/year"
    let totalBenefitValue = 0;
    for (const app of applications) {
      const match = app.benefit?.match(/[\d,]+/);
      if (match) {
        totalBenefitValue += parseInt(match[0].replace(/,/g, ""), 10) || 0;
      }
    }

    const formatBenefit = (val: number) => {
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
      if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
      if (val > 0) return `₹${val.toLocaleString()}`;
      return "—";
    };

    return [
      { label: "Applications", value: String(total), icon: FileCheck, color: "text-foreground", accent: "bg-purple-500/10 text-purple-400" },
      { label: "Under Review", value: String(underReview), icon: Timer, color: "text-amber-400", accent: "bg-amber-500/10 text-amber-400" },
      { label: "Approved", value: String(approved), icon: TrendingUp, color: "text-emerald-400", accent: "bg-emerald-500/10 text-emerald-400" },
      { label: "Est. Benefits", value: formatBenefit(totalBenefitValue), icon: IndianRupee, color: "text-blue-400", accent: "bg-blue-500/10 text-blue-400" },
    ];
  }, [applications]);

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
              Application Tracker
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold font-[family-name:var(--font-display)] tracking-tight mb-3">
              Your Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Track submitted applications and their real-time status
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          >
            {stats.map((stat, i) => (
              <motion.div key={i} variants={staggerItem}>
                <SpotlightCard className="glass rounded-2xl p-4 border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-xl ${stat.accent}`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-bold font-[family-name:var(--font-display)] tabular-nums",
                      stat.color
                    )}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground/60 mt-0.5 font-medium uppercase tracking-wider">
                    {stat.label}
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Applications + Sidebar */}
          <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* Applications */}
          {applications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-5">
                <Inbox className="w-10 h-10 text-muted-foreground/20" />
              </div>
              <h3 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-2">
                No applications yet
              </h3>
              <p className="text-sm text-muted-foreground/50 mb-6 text-center max-w-sm">
                Talk to Adhikaar AI to discover schemes you&apos;re eligible for and apply instantly
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/15"
              >
                <Mic className="w-4 h-4" />
                Start Talking
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-5"
          >
            {applications.map((app) => {
              const currentStatus = statusConfig[app.status];
              const StatusIcon = currentStatus.icon;
              const currentStepIndex = statusOrder.indexOf(app.status);

              return (
                <motion.div key={app.id} variants={staggerItem}>
                  <GlassCard className="p-0 overflow-hidden">
                    {/* App header */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <h3 className="font-semibold text-lg font-[family-name:var(--font-display)]">
                            {app.schemeName}
                          </h3>
                          {app.schemeNameHindi && (
                            <span className="text-xs text-purple-300/40">
                              {app.schemeNameHindi}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground/60">
                          <span className="font-mono">
                            Ref: {app.referenceNumber}
                          </span>
                          <span>Applied: {app.appliedDate}</span>
                          {app.benefit && app.benefit !== "—" && (
                            <span className="text-emerald-400 font-semibold font-mono">
                              {app.benefit}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
                          currentStatus.bg,
                          currentStatus.color
                        )}
                      >
                        <StatusIcon className="w-4 h-4" />
                        {currentStatus.label}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="px-5 pb-2">
                      <div className="h-1 rounded-full bg-white/[0.03] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${((Math.max(currentStepIndex, 0) + 1) / statusOrder.length) * 100}%`,
                          }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Status timeline */}
                    <div className="px-5 pb-5 pt-3">
                      <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
                        {statusOrder.map((status, si) => {
                          const config = statusConfig[status];
                          const isReached = si <= currentStepIndex;
                          const isCurrent = app.status === status;

                          return (
                            <div
                              key={status}
                              className="flex items-center flex-shrink-0"
                            >
                              <div
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all",
                                  isCurrent
                                    ? cn(
                                        "font-semibold",
                                        config.bg,
                                        config.color
                                      )
                                    : isReached
                                      ? "text-emerald-400/70"
                                      : "text-muted-foreground/20"
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    isCurrent
                                      ? "bg-current animate-pulse shadow-[0_0_8px_currentColor]"
                                      : isReached
                                        ? "bg-emerald-400"
                                        : "bg-white/[0.06]"
                                  )}
                                />
                                {config.label}
                              </div>
                              {si < statusOrder.length - 1 && (
                                <div
                                  className={cn(
                                    "w-6 h-px mx-0.5",
                                    isReached
                                      ? "bg-emerald-400/30"
                                      : "bg-white/[0.04]"
                                  )}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Activity timeline */}
                    <div className="px-5 pb-5 pt-1 border-t border-white/[0.04]">
                      <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground/30 mb-3 pt-3">
                        Activity Log
                      </div>
                      <div className="space-y-3">
                        {app.timeline.map((event, ei) => {
                          const evConfig = statusConfig[event.status];
                          const EvIcon = evConfig.icon;
                          return (
                            <div
                              key={ei}
                              className="flex items-start gap-3"
                            >
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                                  evConfig.bg
                                )}
                              >
                                <EvIcon
                                  className={cn("w-3.5 h-3.5", evConfig.color)}
                                />
                              </div>
                              <div>
                                <div className="text-sm">
                                  {event.description}
                                </div>
                                <div className="text-xs text-muted-foreground/40 font-mono mt-0.5">
                                  {event.date} {event.time || ""}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
          )}

          {/* Sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-24 space-y-4">
            <GlassCard className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30 mb-4">
                Quick Actions
              </div>
              <div className="space-y-2">
                <Link
                  href="/chat"
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl glass hover:glass-strong transition-all text-sm group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Mic className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-foreground/80">Apply for Schemes</div>
                    <div className="text-xs text-muted-foreground/50">Talk to Adhikaar</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors" />
                </Link>
                <Link
                  href="/schemes"
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl glass hover:glass-strong transition-all text-sm group"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-foreground/80">Browse Schemes</div>
                    <div className="text-xs text-muted-foreground/50">Explore 42+ schemes</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors" />
                </Link>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30 mb-4">
                Summary
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground/60">Total Applied</span>
                  <span className="font-mono font-semibold">{applications.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground/60">Under Review</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {applications.filter((a) => a.status === "under-review").length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground/60">Approved</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {applications.filter((a) => a.status === "approved" || a.status === "disbursed").length}
                  </span>
                </div>
                <div className="h-px bg-white/[0.04] my-2" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground/60">Est. Benefits</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {stats[3].value}
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>

          </div>

          {/* CTA — only show when no applications */}
          {applications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-12 text-center lg:hidden"
          >
            <GlassCard glow className="max-w-xl mx-auto py-10">
              <h3 className="text-xl font-semibold font-[family-name:var(--font-display)] mb-2">
                Apply for more schemes
              </h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Talk to Adhikaar to discover and auto-apply for welfare schemes
                you&apos;re eligible for.
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
          )}
        </main>
      </PageShell>
    </>
  );
}
