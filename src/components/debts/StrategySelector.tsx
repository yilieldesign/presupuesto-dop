"use client";

import type { DebtStrategy } from "@/types";

interface StrategySelectorProps {
  value: DebtStrategy;
  onChange: (strategy: DebtStrategy) => void;
}

const strategies: {
  id: DebtStrategy;
  label: string;
  description: string;
}[] = [
  {
    id: "snowball",
    label: "Bola de Nieve",
    description: "Ataca la deuda más pequeña primero",
  },
  {
    id: "avalanche",
    label: "Avalancha",
    description: "Ataca la de mayor interés primero",
  },
];

export function StrategySelector({ value, onChange }: StrategySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {strategies.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`rounded-2xl border p-3 text-left transition-all active:scale-[0.98] ${
              active
                ? "border-[var(--ios-tint)] bg-[var(--ios-tint)]/10"
                : "border-[var(--ios-separator)] bg-[var(--ios-card)]"
            }`}
          >
            <p
              className={`text-sm font-semibold ${active ? "text-[var(--ios-tint)]" : ""}`}
            >
              {s.label}
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-[var(--ios-muted)]">
              {s.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
