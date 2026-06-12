"use client";

import { AlertTriangle, CalendarClock, Check } from "lucide-react";
import { canMarkDebtMinimumPaid } from "@/lib/debt/debtSchedule";
import { formatDOP, formatMoney } from "@/lib/currency/format";
import { toDOP } from "@/lib/currency/convert";
import { getDebtPaymentAlerts } from "@/lib/debt/debtSchedule";
import type { Debt } from "@/types";
import { Card } from "@/components/ui/Card";

interface DebtPaymentAlertsProps {
  debts: Debt[];
  exchangeRate: number;
  onMarkMinimumPaid: (id: string) => void;
}

export function DebtPaymentAlerts({
  debts,
  exchangeRate,
  onMarkMinimumPaid,
}: DebtPaymentAlertsProps) {
  const alerts = getDebtPaymentAlerts(debts);

  if (alerts.length === 0) return null;

  return (
    <Card className="border border-[var(--ios-orange)]/30 bg-[var(--ios-orange)]/5">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock size={18} className="text-[var(--ios-orange)]" />
        <h3 className="text-sm font-semibold">Paga antes</h3>
      </div>
      <p className="mb-3 text-xs text-[var(--ios-muted)]">
        Estas deudas tienen fecha. El optimizador las prioriza cuando se acerca
        el vencimiento; las demás se resuelven al paso con tu estrategia.
      </p>
      <div className="space-y-2">
        {alerts.map(({ debt, status, daysUntil, message }) => {
          const minimumDOP =
            debt.currency === "USD"
              ? toDOP(debt.minimumPayment, "USD", exchangeRate)
              : debt.minimumPayment;

          return (
            <div
              key={debt.id}
              className={`rounded-2xl p-3 ${
                status === "due"
                  ? "bg-[var(--ios-red)]/10"
                  : "bg-[var(--ios-bg)]"
              }`}
            >
              <div className="flex items-start gap-2">
                {status === "due" && (
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0 text-[var(--ios-red)]"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{debt.name}</p>
                  <p className="text-xs text-[var(--ios-muted)]">{message}</p>
                  <p className="mt-1 text-xs">
                    Mínimo mensual:{" "}
                    <span className="font-semibold">
                      {formatMoney(debt.minimumPayment, debt.currency)}
                    </span>
                    {debt.currency === "USD" && (
                      <span className="text-[var(--ios-muted)]">
                        {" "}
                        (≈ {formatDOP(minimumDOP)})
                      </span>
                    )}
                  </p>
                  {status === "upcoming" && daysUntil > 0 && (
                    <span className="mt-1 inline-block rounded-full bg-[var(--ios-orange)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--ios-orange)]">
                      {daysUntil === 1 ? "Mañana" : `En ${daysUntil} días`}
                    </span>
                  )}
                  {status === "due" && (
                    <span className="mt-1 inline-block rounded-full bg-[var(--ios-red)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--ios-red)]">
                      Urgente
                    </span>
                  )}
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
                            `¿Registrar mínimo pagado de ${min} en "${debt.name}"?`
                          )
                        ) {
                          onMarkMinimumPaid(debt.id);
                        }
                      }}
                      className="mt-2 flex items-center gap-1 rounded-full bg-[var(--ios-green)]/15 px-3 py-1.5 text-[11px] font-semibold text-[var(--ios-green)]"
                    >
                      <Check size={14} />
                      Mínimo pagado
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
