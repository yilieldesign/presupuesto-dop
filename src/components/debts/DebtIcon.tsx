"use client";

import {
  CreditCard,
  Landmark,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react";
import type { Currency } from "@/types";

type DebtIconType = "card" | "loan" | "dop";

function resolveDebtIconType(name: string, currency: Currency): DebtIconType {
  const n = name.toLowerCase();

  if (
    /tarjeta|visa|mastercard|amex|scotiabank|bhd|popular|card/i.test(n)
  ) {
    return "card";
  }

  if (/pr[eé]stamo|loan|financ/i.test(n)) {
    return "loan";
  }

  return currency === "USD" ? "card" : "dop";
}

const ICON_MAP: Record<DebtIconType, LucideIcon> = {
  card: CreditCard,
  loan: Landmark,
  dop: CircleDollarSign,
};

const COLOR_MAP: Record<DebtIconType, { bg: string; fg: string; bar: string }> =
  {
    card: {
      bg: "bg-[var(--ios-green)]/15",
      fg: "text-[var(--ios-green)]",
      bar: "bg-[var(--ios-green)]",
    },
    loan: {
      bg: "bg-[var(--ios-tint)]/15",
      fg: "text-[var(--ios-tint)]",
      bar: "bg-[var(--ios-tint)]",
    },
    dop: {
      bg: "bg-[var(--ios-orange)]/15",
      fg: "text-[var(--ios-orange)]",
      bar: "bg-[var(--ios-orange)]",
    },
  };

interface DebtIconProps {
  name: string;
  currency: Currency;
  size?: "sm" | "md";
}

export function DebtIcon({ name, currency, size = "md" }: DebtIconProps) {
  const type = resolveDebtIconType(name, currency);
  const Icon = ICON_MAP[type];
  const colors = COLOR_MAP[type];
  const box = size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const iconSize = size === "sm" ? 14 : 20;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full ${box} ${colors.bg}`}
    >
      <Icon size={iconSize} className={colors.fg} strokeWidth={2.25} />
    </div>
  );
}

export function getDebtProgressBarClass(name: string, currency: Currency): string {
  const type = resolveDebtIconType(name, currency);
  return COLOR_MAP[type].bar;
}
