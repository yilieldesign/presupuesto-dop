"use client";

import { Trash2 } from "lucide-react";
import { formatDOP, formatMoney } from "@/lib/currency/format";
import { toDOP } from "@/lib/currency/convert";
import { WEEKS_PER_MONTH } from "@/lib/debt/utils";
import type { Debt } from "@/types";
import { Card } from "@/components/ui/Card";
import { DebtIcon, getDebtProgressBarClass } from "./DebtIcon";

interface DebtListProps {
  debts: Debt[];
  exchangeRate: number;
  onRemove: (id: string) => void;
}

export function DebtList({ debts, exchangeRate, onRemove }: DebtListProps) {
  if (debts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="px-1 text-xs font-medium uppercase tracking-wider text-[var(--ios-muted)]">
        Tus deudas
      </h3>
      {debts.map((debt) => {
        const weeklyMin = debt.minimumPayment / WEEKS_PER_MONTH;
        const progress =
          debt.originalBalance > 0
            ? ((debt.originalBalance - debt.balance) /
                debt.originalBalance) *
              100
            : 0;
        const progressBarClass = getDebtProgressBarClass(
          debt.name,
          debt.currency
        );

        return (
          <Card key={debt.id} padding="sm">
            <div className="flex items-start gap-3">
              <DebtIcon name={debt.name} currency={debt.currency} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{debt.name}</p>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      debt.currency === "USD"
                        ? "bg-[var(--ios-green)]/15 text-[var(--ios-green)]"
                        : "bg-[var(--ios-tint)]/15 text-[var(--ios-tint)]"
                    }`}
                  >
                    {debt.currency}
                  </span>
                </div>
                <p className="text-lg font-bold">
                  {formatMoney(debt.balance, debt.currency)}
                </p>
                {debt.currency === "USD" && (
                  <p className="text-xs text-[var(--ios-muted)]">
                    ≈ {formatDOP(toDOP(debt.balance, "USD", exchangeRate))} a{" "}
                    {exchangeRate.toFixed(2)}/US$
                  </p>
                )}
                <p className="text-xs text-[var(--ios-muted)]">
                  {debt.interestRate}% APR · Mín. semanal{" "}
                  {formatMoney(weeklyMin, debt.currency)}
                  {debt.currency === "USD" && (
                    <>
                      {" "}
                      (≈ {formatDOP(toDOP(weeklyMin, "USD", exchangeRate))})
                    </>
                  )}
                </p>
                {debt.currency === "USD" && (
                  <p className="text-[10px] text-[var(--ios-muted)]">
                    Mín. mensual: {formatMoney(debt.minimumPayment, "USD")} ≈{" "}
                    {formatDOP(
                      toDOP(debt.minimumPayment, "USD", exchangeRate)
                    )}
                  </p>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ios-bg)]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressBarClass}`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemove(debt.id)}
                className="shrink-0 rounded-lg p-2 text-[var(--ios-muted)] active:bg-[var(--ios-bg)]"
                aria-label={`Eliminar ${debt.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
