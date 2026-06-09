"use client";

import { formatDOP, formatMoney } from "@/lib/currency/format";
import type { CashAllocation, OptimizationResult } from "@/lib/debt/optimizer";
import { Card } from "@/components/ui/Card";
import { ArrowRight, Sparkles, AlertTriangle, Utensils } from "lucide-react";

interface OptimizationReceiptProps {
  result: OptimizationResult;
}

function formatAllocation(allocation: CashAllocation): string {
  const native = formatMoney(allocation.amount, allocation.currency);
  if (allocation.currency === "USD") {
    return `${native} (≈ ${formatDOP(allocation.amountDOP)})`;
  }
  return native;
}

export function OptimizationReceipt({ result }: OptimizationReceiptProps) {
  const minimums = result.allocations.filter((a) => a.type === "weekly_minimum");
  const extra = result.allocations.find((a) => a.type === "extra_injection");

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-4 border-b border-dashed border-[var(--ios-separator)] pb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--ios-muted)]">
          Recibo de optimización
        </p>
        <p className="mt-1 text-base font-semibold">
          De tus {formatDOP(result.cashAmount)} de hoy:
        </p>
        <p className="mt-0.5 text-xs text-[var(--ios-muted)]">
          Tasa: RD${result.exchangeRate.toFixed(2)} / US$1
        </p>
      </div>

      <div className="space-y-3">
        {result.vitalFundReserved > 0 && (
          <div className="flex gap-2 rounded-xl bg-[var(--ios-orange)]/10 p-3">
            <Utensils
              size={18}
              className="mt-0.5 shrink-0 text-[var(--ios-orange)]"
            />
            <p className="text-sm leading-snug">
              <span className="font-semibold text-[var(--ios-orange)]">
                {formatDOP(result.vitalFundReserved)}
              </span>{" "}
              reservados para tu{" "}
              <span className="font-medium">fondo vital de la semana</span>
            </p>
          </div>
        )}

        {minimums.map((allocation) => (
          <div key={`${allocation.debtId}-min`} className="flex gap-2">
            <ArrowRight
              size={16}
              className="mt-0.5 shrink-0 text-[var(--ios-muted)]"
            />
            <p className="text-sm leading-snug">
              <span className="font-semibold text-[var(--ios-tint)]">
                {formatAllocation(allocation)}
              </span>{" "}
              van para el pago mínimo semanal de{" "}
              <span className="font-medium">{allocation.debtName}</span>
              <span className="text-[var(--ios-muted)]">
                {" "}
                (mín. semanal:{" "}
                {formatMoney(
                  allocation.weeklyMinimumDue,
                  allocation.currency
                )}
                )
              </span>
            </p>
          </div>
        ))}

        {extra && (
          <div className="flex gap-2 rounded-xl bg-[var(--ios-green)]/10 p-3">
            <Sparkles
              size={18}
              className="mt-0.5 shrink-0 text-[var(--ios-green)]"
            />
            <p className="text-sm leading-snug">
              <span className="font-bold text-[var(--ios-green)]">
                ¡Inyección Extra!
              </span>{" "}
              {formatAllocation(extra)} directo al capital de{" "}
              <span className="font-semibold">{extra.debtName}</span>
              {result.priorityByDueDate && (
                <span className="mt-1 block text-xs text-[var(--ios-orange)]">
                  Prioridad por fecha de pago próxima o vencida
                </span>
              )}
            </p>
          </div>
        )}

        {result.insufficientForVitalFund && (
          <div className="flex gap-2 rounded-xl bg-[var(--ios-orange)]/10 p-3">
            <AlertTriangle
              size={16}
              className="shrink-0 text-[var(--ios-orange)]"
            />
            <p className="text-xs text-[var(--ios-orange)]">
              Este cobro no alcanza para cubrir todo el fondo vital pendiente (
              {formatDOP(result.vitalFundNeeded)}).
            </p>
          </div>
        )}

        {result.insufficientForMinimums && result.totalAllocated > 0 && (
          <div className="flex gap-2 rounded-xl bg-[var(--ios-orange)]/10 p-3">
            <AlertTriangle
              size={16}
              className="shrink-0 text-[var(--ios-orange)]"
            />
            <p className="text-xs text-[var(--ios-orange)]">
              Tras el fondo vital, no alcanza para todos los mínimos semanales (
              {formatDOP(result.totalWeeklyMinimumsRequired)} en RD$).
            </p>
          </div>
        )}

        {result.unallocated > 0 && (
          <p className="text-xs text-[var(--ios-muted)]">
            Sin asignar: {formatDOP(result.unallocated)}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2 border-t border-[var(--ios-separator)] pt-3 text-sm">
        {result.vitalFundReserved > 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--ios-muted)]">Fondo vital</span>
            <span className="font-semibold text-[var(--ios-orange)]">
              {formatDOP(result.vitalFundReserved)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[var(--ios-muted)]">Total a deudas</span>
          <span className="font-bold">{formatDOP(result.totalAllocated)}</span>
        </div>
        <div className="flex justify-between border-t border-[var(--ios-separator)] pt-2">
          <span className="font-medium">Total asignado</span>
          <span className="font-bold">{formatDOP(result.totalAssigned)}</span>
        </div>
      </div>
    </Card>
  );
}
