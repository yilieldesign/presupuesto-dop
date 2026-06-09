import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const variants = {
  primary: "bg-[var(--ios-tint)] text-white active:opacity-80",
  secondary:
    "bg-[var(--ios-bg)] text-[var(--ios-tint)] border border-[var(--ios-separator)] active:opacity-70",
  danger: "bg-[var(--ios-red)] text-white active:opacity-80",
  ghost: "bg-transparent text-[var(--ios-tint)] active:opacity-60",
};

const sizes = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-11 px-4 text-base rounded-xl",
  lg: "h-14 px-6 text-lg font-semibold rounded-2xl",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
