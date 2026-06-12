"use client";

import {
  UtensilsCrossed,
  Fuel,
  Car,
  Wrench,
  Smartphone,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { VitalFundCategory } from "@/types";

const ICON_MAP: Record<VitalFundCategory, LucideIcon> = {
  comida: UtensilsCrossed,
  combustible: Fuel,
  transporte: Car,
  herramientas: Wrench,
  servicios: Smartphone,
  otros: Package,
};

const COLOR_MAP: Record<
  VitalFundCategory,
  { bg: string; fg: string }
> = {
  comida: { bg: "bg-[var(--ios-orange)]/15", fg: "text-[var(--ios-orange)]" },
  combustible: { bg: "bg-[var(--ios-red)]/15", fg: "text-[var(--ios-red)]" },
  transporte: { bg: "bg-[var(--ios-tint)]/15", fg: "text-[var(--ios-tint)]" },
  herramientas: {
    bg: "bg-[#af52de]/15",
    fg: "text-[#af52de]",
  },
  servicios: { bg: "bg-[#ffcc00]/20", fg: "text-[#b8860b]" },
  otros: { bg: "bg-[var(--ios-muted)]/15", fg: "text-[var(--ios-muted)]" },
};

interface VitalFundIconProps {
  category: VitalFundCategory;
  size?: "sm" | "md";
}

export function VitalFundIcon({ category, size = "md" }: VitalFundIconProps) {
  const Icon = ICON_MAP[category];
  const colors = COLOR_MAP[category];
  const box = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full ${box} ${colors.bg}`}
    >
      <Icon size={iconSize} className={colors.fg} strokeWidth={2.25} />
    </div>
  );
}
