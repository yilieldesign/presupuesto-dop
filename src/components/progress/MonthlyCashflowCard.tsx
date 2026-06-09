"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Scale,
} from "lucide-react";
import { formatDOP } from "@/lib/currency/format";
import {
  getAvailableMonthKeys,
  getSummaryForMonth,
} from "@/lib/budget/monthlyStats";
import type { Transaction } from "@/types";
import { Card } from "@/components/ui/Card";

interface MonthlyCashflowCardProps {
  transactions: Transaction[];
}

export function MonthlyCashflowCard({ transactions }: MonthlyCashflowCardProps) {
  const monthKeys = useMemo(
    () => getAvailableMonthKeys(transactions),
    [transactions]
  );

  const [index, setIndex] = useState(0);
  const monthKey = monthKeys[index] ?? monthKeys[0];
  const summary = monthKey
    ? getSummaryForMonth(transactions, monthKey)
    : null;

  const canGoNewer = index > 0;
  const canGoOlder = index < monthKeys.length - 1;

  if (!summary) {
    return (
      <Card>
        <h3 className="mb-2 text-sm font-semibold">Estado mensual</h3>
        <p className="text-sm text-[var(--ios-muted)]">
          Registra ingresos y gastos para ver tu balance por mes.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Estado mensual</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canGoOlder}
            onClick={() => setIndex((i) => Math.min(monthKeys.length - 1, i + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ios-bg)] text-[var(--ios-tint)] disabled:opacity-30"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[7rem] text-center text-xs font-medium capitalize text-[var(--ios-muted)]">
            {summary.label}
          </span>
          <button
            type="button"
            disabled={!canGoNewer}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ios-bg)] text-[var(--ios-tint)] disabled:opacity-30"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-[var(--ios-green)]/10 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[var(--ios-green)]">
            <ArrowDownLeft size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              Ganado
            </span>
          </div>
          <p className="text-lg font-bold text-[var(--ios-green)]">
            {formatDOP(summary.income)}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--ios-red)]/10 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[var(--ios-red)]">
            <ArrowUpRight size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">
              Pagado
            </span>
          </div>
          <p className="text-lg font-bold text-[var(--ios-red)]">
            {formatDOP(summary.totalPaid)}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 rounded-2xl bg-[var(--ios-bg)] p-3 text-xs">
        <div className="flex justify-between">
          <span className="text-[var(--ios-muted)]">Gastos</span>
          <span className="font-medium">{formatDOP(summary.expenses)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--ios-muted)]">Pagos a deudas</span>
          <span className="font-medium">{formatDOP(summary.debtPayments)}</span>
        </div>
      </div>

      <div
        className={`mt-3 flex items-center justify-between rounded-2xl p-3 ${
          summary.net >= 0
            ? "bg-[var(--ios-tint)]/10"
            : "bg-[var(--ios-orange)]/10"
        }`}
      >
        <div className="flex items-center gap-2">
          <Scale
            size={16}
            className={
              summary.net >= 0
                ? "text-[var(--ios-tint)]"
                : "text-[var(--ios-orange)]"
            }
          />
          <span className="text-sm font-medium">Balance del mes</span>
        </div>
        <span
          className={`text-lg font-bold ${
            summary.net >= 0
              ? "text-[var(--ios-green)]"
              : "text-[var(--ios-red)]"
          }`}
        >
          {summary.net >= 0 ? "+" : ""}
          {formatDOP(summary.net)}
        </span>
      </div>
    </Card>
  );
}
