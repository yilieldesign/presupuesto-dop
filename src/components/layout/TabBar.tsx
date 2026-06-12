"use client";

import { Wallet, TrendingDown, BarChart3, PiggyBank, CalendarClock } from "lucide-react";
import type { TabId } from "@/types";

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Wallet }[] = [
  { id: "budget", label: "Presup.", icon: Wallet },
  { id: "fixed", label: "Fijos", icon: CalendarClock },
  { id: "debts", label: "Deudas", icon: TrendingDown },
  { id: "savings", label: "Ahorro", icon: PiggyBank },
  { id: "progress", label: "Progreso", icon: BarChart3 },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--ios-separator)] bg-[var(--ios-card)]/95 backdrop-blur-xl"
      style={{ paddingBottom: "max(8px, env(safe-area-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-0.5 pt-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-colors active:scale-95 ${
                active ? "text-[var(--ios-tint)]" : "text-[var(--ios-muted)]"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className="max-w-full truncate text-[9px] font-medium">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
