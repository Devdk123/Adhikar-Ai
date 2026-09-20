"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FAQ {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  image?: string;
  faqs?: FAQ[];
  className?: string;
}

const FaqSection = ({
  title = "Common Questions",
  subtitle = "Everything you need to know about how Adhikaar helps you access government welfare schemes.",
  badge = "FAQ",
  // Indian government office / helpful official image
  image = "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=830&h=960&auto=format&fit=crop",
  faqs = [
    {
      question: "How to use this component?",
      answer: "Import it in your project and drop it into any page.",
    },
  ],
  className,
}: FaqSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "max-w-5xl mx-auto px-4 md:px-6",
        className
      )}
    >
      {/* Badge + heading — above the two-col grid on mobile */}
      <div className="mb-8 md:hidden">
        <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-2">
          {badge}
        </p>
        <h2 className="text-3xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground/60 mt-2">{subtitle}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
        {/* ── Left column — sticky image card ── */}
        <div className="w-full md:w-[340px] flex-shrink-0 md:sticky md:top-24 self-start">
          {/* Glassmorphism card wrapping the image */}
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.06] bg-white/[0.03] shadow-2xl shadow-black/40">
            {/* Gradient overlay on bottom of image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 pointer-events-none rounded-3xl" />

            <Image
              src={image}
              alt="FAQ illustration"
              width={830}
              height={960}
              sizes="(max-width: 768px) 100vw, 340px"
              className="w-full h-[420px] object-cover object-center"
              priority
            />

            {/* Caption badge inside image */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600/80 backdrop-blur-sm text-white text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Adhikaar AI
              </span>
            </div>
          </div>

          {/* Stats bar below image */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { value: "500+", label: "Schemes Listed" },
              { value: "3 min", label: "Avg. Apply Time" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-center"
              >
                <div className="text-lg font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-[11px] text-muted-foreground/50 mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column — heading + accordion ── */}
        <div className="flex-1 min-w-0">
          {/* Heading (hidden on mobile, shown in two-col layout) */}
          <div className="hidden md:block mb-8">
            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-2">
              {badge}
            </p>
            <h2 className="text-4xl font-bold text-foreground leading-tight">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground/60 mt-3 max-w-sm leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Accordion */}
          <div className="space-y-0 divide-y divide-white/[0.05]">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className="group">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenIndex(isOpen ? null : index)
                    }
                    className="w-full flex items-start justify-between gap-4 py-5 text-left focus:outline-none"
                  >
                    <span
                      className={cn(
                        "text-[15px] font-medium transition-colors duration-200 leading-snug",
                        isOpen
                          ? "text-indigo-400"
                          : "text-foreground/80 group-hover:text-foreground"
                      )}
                    >
                      {faq.question}
                    </span>

                    {/* Animated plus / minus icon */}
                    <span
                      className={cn(
                        "flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300",
                        isOpen
                          ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                          : "border-white/[0.08] text-muted-foreground group-hover:border-white/20"
                      )}
                      style={{
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        transition: "transform 0.3s ease-in-out, background 0.2s, border-color 0.2s",
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6 1v10M1 6h10"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>

                  {/* Animated answer */}
                  <div
                    style={{
                      overflow: "hidden",
                      maxHeight: isOpen ? "400px" : "0px",
                      opacity: isOpen ? 1 : 0,
                      transition:
                        "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
                    }}
                  >
                    <p className="text-sm text-muted-foreground/70 leading-relaxed pb-5 max-w-xl">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqSection;
