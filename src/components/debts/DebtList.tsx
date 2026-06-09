"use client";

import { Check, Trash2 } from "lucide-react";
import { canMarkDebtMinimumPaid } from "@/lib/debt/debtSchedule";
import { formatDOP, formatMoney } from "@/lib/currency/format";
import { toDOP } from "@/lib/currency/convert";
import { WEEKS_PER_MONTH } from "@/lib/debt/utils";
import {
  formatDebtDueLabel,
  getDebtDueStatus,
  isScheduledDebt,
} from "@/lib/debt/debtSchedule";
import { toDateKey } from "@/lib/budget/fixedExpenses";
import type { Debt } from "@/types";
import { Card } from "@/components/ui/Card";
import { DebtIcon, getDebtProgressBarClass } from "./DebtIcon";
import { DebtMonthlyMinimum } from "./DebtMonthlyMinimum";

interface DebtListProps {
  debts: Debt[];
  exchangeRate: number;
  onRemove: (id: string) => void;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<Debt, "nextPaymentDate" | "paymentPriority" | "minimumPayment">
    >
  ) => void;
  onMarkMinimumPaid: (id: string) => void;
}

const DUE_STYLES = {
  due: "bg-[var(--ios-red)]/15 text-[var(--ios-red)]",
  upcoming: "bg-[var(--ios-orange)]/15 text-[var(--ios-orange)]",
  paid: "bg-[var(--ios-green)]/15 text-[var(--ios-green)]",
  flexible: "bg-[var(--ios-bg)] text-[var(--ios-muted)]",
} as const;

export function DebtList({
  debts,
  exchangeRate,
  onRemove,
  onUpdate,
  onMarkMinimumPaid,
}: DebtListProps) {
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
        const dueStatus = getDebtDueStatus(debt);
        const scheduled = isScheduledDebt(debt);

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
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                      scheduled
                        ? "bg-[var(--ios-orange)]/15 text-[var(--ios-orange)]"
                        : "bg-[var(--ios-bg)] text-[var(--ios-muted)]"
                    }`}
                  >
                    {scheduled ? "Fecha fija" : "Al paso"}
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
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${DUE_STYLES[dueStatus]}`}
                >
                  {formatDebtDueLabel(debt)}
                </span>
                {scheduled && (
                  <>
                    <DebtMonthlyMinimum
                      debt={debt}
                      exchangeRate={exchangeRate}
                      onSave={(minimumPayment) =>
                        onUpdate(debt.id, { minimumPayment })
                      }
                    />
                    {debt.nextPaymentDate && (
                      <div className="mt-2">
                        <label className="mb-1 block text-[10px] text-[var(--ios-muted)]">
                          Fecha de pago
                        </label>
                        <input
                          type="date"
                          value={debt.nextPaymentDate}
                          min={toDateKey(new Date())}
                          onChange={(e) =>
                            onUpdate(debt.id, {
                              nextPaymentDate: e.target.value,
                            })
                          }
                          className="rounded-lg border border-[var(--ios-separator)] bg-[var(--ios-bg)] px-2 py-1 text-[11px] outline-none"
                          aria-label={`Fecha de pago de ${debt.name}`}
                        />
                      </div>
                    )}
                  </>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ios-bg)]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressBarClass}`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                {canMarkDebtMinimumPaid(debt) && (
                  <button
                    type="button"
                    onClick={() => {
                      const min = formatMoney(
                        debt.minimumPayment,
                        debt.currency
                      );
                      if (
                        window.confirm(
                          `¿Registrar mínimo pagado de ${min} en "${debt.name}"? Se descontará del saldo y avanzará la fecha al próximo mes.`
                        )
                      ) {
                        onMarkMinimumPaid(debt.id);
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ios-green)]/15 text-[var(--ios-green)]"
                    aria-label={`Mínimo pagado — ${debt.name}`}
                    title="Mínimo pagado este mes"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(debt.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ios-red)]/10 text-[var(--ios-red)]"
                  aria-label={`Eliminar ${debt.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
