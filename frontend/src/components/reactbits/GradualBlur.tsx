"use client";

import React, { useMemo } from "react";

interface GradualBlurProps {
  /** Which edge of the parent to attach to */
  position?: "top" | "bottom";
  /** Blur intensity multiplier */
  strength?: number;
  /** Height of the blur region */
  height?: string;
  /** Number of stacked blur layers (more = smoother gradient) */
  divCount?: number;
  /** Use exponential blur curve for stronger falloff */
  exponential?: boolean;
  /** z-index of the blur overlay */
  zIndex?: number;
  /** Opacity of blur layers */
  opacity?: number;
  /** Easing curve for blur distribution */
  curve?: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bezier";
  className?: string;
  style?: React.CSSProperties;
}

const CURVE_FUNCTIONS: Record<string, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - Math.pow(1 - p, 2),
  "ease-in-out": (p) =>
    p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
};

const GradualBlur: React.FC<GradualBlurProps> = ({
  position = "bottom",
  strength = 2,
  height = "6rem",
  divCount = 5,
  exponential = false,
  zIndex = 10,
  opacity = 1,
  curve = "linear",
  className = "",
  style,
}) => {
  const blurDivs = useMemo(() => {
    const divs: React.ReactNode[] = [];
    const increment = 100 / divCount;
    const curveFunc = CURVE_FUNCTIONS[curve] || CURVE_FUNCTIONS.linear;
    const direction = position === "top" ? "to top" : "to bottom";

    for (let i = 1; i <= divCount; i++) {
      let progress = curveFunc(i / divCount);

      const blurValue = exponential
        ? Math.pow(2, progress * 4) * 0.0625 * strength
        : 0.0625 * (progress * divCount + 1) * strength;

      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      divs.push(
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            maskImage: `linear-gradient(${direction}, ${gradient})`,
            WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
            backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            opacity,
          }}
        />
      );
    }

    return divs;
  }, [divCount, strength, exponential, position, opacity, curve]);

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex,
    height,
    width: "100%",
    left: 0,
    right: 0,
    [position]: 0,
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {blurDivs}
      </div>
    </div>
  );
};

export default GradualBlur;
