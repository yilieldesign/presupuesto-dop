import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-[var(--ios-card)] shadow-sm transition-colors ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
