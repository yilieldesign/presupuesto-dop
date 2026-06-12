"use client";

import {
  Shield,
  Camera,
  Umbrella,
  Star,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";
import type { SavingsGoalCategory } from "@/types";

const ICON_MAP: Record<SavingsGoalCategory, LucideIcon> = {
  emergency: Shield,
  equipment: Camera,
  buffer: Umbrella,
  personal: Star,
  other: PiggyBank,
};

const COLOR_MAP: Record<SavingsGoalCategory, { bg: string; fg: string; bar: string }> =
  {
    emergency: {
      bg: "bg-[var(--ios-tint)]/15",
      fg: "text-[var(--ios-tint)]",
      bar: "bg-[var(--ios-tint)]",
    },
    equipment: {
      bg: "bg-[#af52de]/15",
      fg: "text-[#af52de]",
      bar: "bg-[#af52de]",
    },
    buffer: {
      bg: "bg-[var(--ios-orange)]/15",
      fg: "text-[var(--ios-orange)]",
      bar: "bg-[var(--ios-orange)]",
    },
    personal: {
      bg: "bg-[var(--ios-green)]/15",
      fg: "text-[var(--ios-green)]",
      bar: "bg-[var(--ios-green)]",
    },
    other: {
      bg: "bg-[var(--ios-muted)]/15",
      fg: "text-[var(--ios-muted)]",
      bar: "bg-[var(--ios-muted)]",
    },
  };

interface SavingsIconProps {
  category: SavingsGoalCategory;
  size?: "sm" | "md";
}

export function SavingsIcon({ category, size = "md" }: SavingsIconProps) {
  const Icon = ICON_MAP[category];
  const colors = COLOR_MAP[category];
  const box = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? 15 : 20;

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full ${box} ${colors.bg}`}
    >
      <Icon size={iconSize} className={colors.fg} strokeWidth={2.25} />
    </div>
  );
}

export function getSavingsProgressBarClass(
  category: SavingsGoalCategory
): string {
  return COLOR_MAP[category].bar;
}
