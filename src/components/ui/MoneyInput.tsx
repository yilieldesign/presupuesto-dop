"use client";

import type { Currency } from "@/types";
import { formatMoney, parseMoneyInput, currencySymbol } from "@/lib/currency/format";

interface MoneyInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
  size?: "md" | "lg";
  currency?: Currency;
}

export function MoneyInput({
  value,
  onChange,
  label,
  placeholder = "0.00",
  autoFocus = false,
  size = "md",
  currency = "DOP",
}: MoneyInputProps) {
  const numeric = parseMoneyInput(value);
  const sizeClass =
    size === "lg"
      ? "text-4xl font-bold tracking-tight"
      : "text-xl font-semibold";

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-[var(--ios-muted)]">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ios-muted)]">
          {currencySymbol(currency)}
        </span>
        <input
          type="text"
          inputMode="decimal"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-2xl border border-[var(--ios-separator)] bg-[var(--ios-bg)] py-4 pl-14 pr-4 text-[var(--ios-text)] outline-none transition-all focus:border-[var(--ios-tint)] focus:ring-2 focus:ring-[var(--ios-tint)]/20 ${sizeClass}`}
        />
      </div>
      {numeric > 0 && size === "lg" && (
        <p className="mt-2 text-center text-sm text-[var(--ios-muted)]">
          {formatMoney(numeric, currency)}
        </p>
      )}
    </div>
  );
}
