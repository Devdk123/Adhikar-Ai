import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "warm" | "vivid";
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export default function GradientText({
  children,
  className,
  variant = "default",
  as: Component = "span",
}: GradientTextProps) {
  const variantClass = {
    default: "gradient-text",
    warm: "gradient-text-warm",
    vivid: "gradient-text-vivid",
  }[variant];

  return (
    <Component className={cn(variantClass, className)}>
      {children}
    </Component>
  );
}
