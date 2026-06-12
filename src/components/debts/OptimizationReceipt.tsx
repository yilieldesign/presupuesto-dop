"use client";

import { formatDOP, formatMoney } from "@/lib/currency/format";
import { EXPENSE_CATEGORIES } from "@/lib/budget/categories";
import type { CashAllocation, OptimizationResult } from "@/lib/debt/optimizer";
import {
  getAllocationLineKey,
  isFixedExpenseAllocation,
  VITAL_FUND_LINE_KEY,
} from "@/lib/debt/optimizer";
import { Card } from "@/components/ui/Card";
import {
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Utensils,
  X,
  RotateCcw,
  CalendarClock,
} from "lucide-react";

interface OptimizationReceiptProps {
  result: OptimizationResult;
  hasExcludedLines?: boolean;
  onRemoveLine?: (lineKey: string) => void;
  onRestoreAll?: () => void;
}

function formatAllocation(allocation: CashAllocation): string {
  const native = formatMoney(allocation.amount, allocation.currency);
  if (allocation.currency === "USD") {
    return `${native} (≈ ${formatDOP(allocation.amountDOP)})`;
  }
  return native;
}

function RemoveLineButton({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: () => void;
}) {
  if (!onRemove) return null;

  return (
    <button
      type="button"
      onClick={onRemove}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ios-red)]/10 text-[var(--ios-red)]"
      aria-label={`Quitar ${label} del plan`}
    >
      <X size={14} />
    </button>
  );
}

export function OptimizationReceipt({
  result,
  hasExcludedLines = false,
  onRemoveLine,
  onRestoreAll,
}: OptimizationReceiptProps) {
  const fixedExpenses = result.allocations.filter(isFixedExpenseAllocation);
  const commitments = result.allocations.filter(
    (a) =>
      a.type === "commitment_payment" ||
      (a.type as string) === "weekly_minimum"
  );
  const extra = result.allocations.find((a) => a.type === "extra_injection");
  const editable = !!onRemoveLine;

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-4 border-b border-dashed border-[var(--ios-separator)] pb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--ios-muted)]">
          Recibo de optimización
        </p>
        <p className="mt-1 text-base font-semibold">
          De tus {formatDOP(result.cashAmount)} de hoy:
        </p>
        {editable && (
          <p className="mt-1 text-xs text-[var(--ios-muted)]">
            Quita lo que no pagarás ahora — tú tienes la decisión final.
          </p>
        )}
        <p className="mt-0.5 text-xs text-[var(--ios-muted)]">
          Tasa: RD${result.exchangeRate.toFixed(2)} / US$1
        </p>
        {hasExcludedLines && onRestoreAll && (
          <button
            type="button"
            onClick={onRestoreAll}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--ios-tint)]"
          >
            <RotateCcw size={12} />
            Restaurar plan original
          </button>
        )}
      </div>

      <div className="space-y-3">
        {result.vitalFundReserved > 0 && (
          <div className="flex items-start gap-2 rounded-xl bg-[var(--ios-orange)]/10 p-3">
            <Utensils
              size={18}
              className="mt-0.5 shrink-0 text-[var(--ios-orange)]"
            />
            <p className="min-w-0 flex-1 text-sm leading-snug">
              <span className="font-semibold text-[var(--ios-orange)]">
                {formatDOP(result.vitalFundReserved)}
              </span>{" "}
              reservados para tu{" "}
              <span className="font-medium">fondo vital de la semana</span>
            </p>
            <RemoveLineButton
              label="fondo vital"
              onRemove={
                onRemoveLine
                  ? () => onRemoveLine(VITAL_FUND_LINE_KEY)
                  : undefined
              }
            />
          </div>
        )}

        {fixedExpenses.map((allocation) => {
          const cat = EXPENSE_CATEGORIES.find((c) => c.id === allocation.category);
          return (
            <div
              key={`${allocation.debtId}-fixed`}
              className="flex items-start gap-2 rounded-xl bg-[var(--ios-tint)]/8 p-3"
            >
              <CalendarClock
                size={18}
                className="mt-0.5 shrink-0 text-[var(--ios-tint)]"
              />
              <p className="min-w-0 flex-1 text-sm leading-snug">
                <span className="font-semibold text-[var(--ios-tint)]">
                  {formatDOP(allocation.amountDOP)}
                </span>{" "}
                para{" "}
                <span className="font-medium">{allocation.debtName}</span>
                {cat && (
                  <span className="text-[var(--ios-muted)]"> · {cat.label}</span>
                )}
                <span className="text-[var(--ios-muted)]">
                  {" "}
                  (compromiso: {formatDOP(allocation.commitmentAmountDue)})
                </span>
                {!allocation.paidInFull && (
                  <span className="mt-1 block text-xs text-[var(--ios-orange)]">
                    Pago parcial — no marca el mes como cubierto
                  </span>
                )}
              </p>
              <RemoveLineButton
                label={`gasto fijo ${allocation.debtName}`}
                onRemove={
                  onRemoveLine
                    ? () => onRemoveLine(getAllocationLineKey(allocation))
                    : undefined
                }
              />
            </div>
          );
        })}

        {commitments.map((allocation) => (
          <div
            key={`${allocation.debtId}-commit`}
            className="flex items-start gap-2"
          >
            <ArrowRight
              size={16}
              className="mt-0.5 shrink-0 text-[var(--ios-muted)]"
            />
            <p className="min-w-0 flex-1 text-sm leading-snug">
              <span className="font-semibold text-[var(--ios-tint)]">
                {formatAllocation(allocation)}
              </span>{" "}
              cubren el{" "}
              <span className="font-medium">mínimo mensual</span> de{" "}
              <span className="font-medium">{allocation.debtName}</span>
              <span className="text-[var(--ios-muted)]">
                {" "}
                (compromiso:{" "}
                {formatMoney(
                  allocation.commitmentAmountDue,
                  allocation.currency
                )}
                )
              </span>
            </p>
            <RemoveLineButton
              label={`pago a ${allocation.debtName}`}
              onRemove={
                onRemoveLine
                  ? () => onRemoveLine(getAllocationLineKey(allocation))
                  : undefined
              }
            />
          </div>
        ))}

        {extra && (
          <div className="flex items-start gap-2 rounded-xl bg-[var(--ios-green)]/10 p-3">
            <Sparkles
              size={18}
              className="mt-0.5 shrink-0 text-[var(--ios-green)]"
            />
            <p className="min-w-0 flex-1 text-sm leading-snug">
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
            <RemoveLineButton
              label={`inyección a ${extra.debtName}`}
              onRemove={
                onRemoveLine
                  ? () => onRemoveLine(getAllocationLineKey(extra))
                  : undefined
              }
            />
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

        {result.insufficientForCommitments && result.totalAllocated > 0 && (
          <div className="flex gap-2 rounded-xl bg-[var(--ios-orange)]/10 p-3">
            <AlertTriangle
              size={16}
              className="shrink-0 text-[var(--ios-orange)]"
            />
            <p className="text-xs text-[var(--ios-orange)]">
              Tras el fondo vital, no alcanza para todos los compromisos
              urgentes ({formatDOP(result.totalCommitmentsRequired)} en RD$).
              Gastos fijos y deudas se cubren en orden de fecha.
            </p>
          </div>
        )}

        {result.unallocated > 0 && (
          <p className="rounded-xl bg-[var(--ios-bg)] px-3 py-2 text-xs text-[var(--ios-muted)]">
            Sin asignar (queda contigo):{" "}
            <span className="font-semibold text-[var(--ios-text)]">
              {formatDOP(result.unallocated)}
            </span>
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
        {result.totalAllocatedToFixedExpenses > 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--ios-muted)]">Gastos fijos</span>
            <span className="font-semibold text-[var(--ios-tint)]">
              {formatDOP(result.totalAllocatedToFixedExpenses)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[var(--ios-muted)]">Total a deudas</span>
          <span className="font-bold">
            {formatDOP(result.totalAllocatedToDebts)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--ios-muted)]">Total obligaciones</span>
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
