"use client";

import { AlertTriangle, ChevronRight } from "lucide-react";
import {
  formatDueLabel,
  getFixedExpenseStatus,
  sortFixedExpensesByUrgency,
} from "@/lib/budget/fixedExpenses";
import { formatDOP } from "@/lib/currency/format";
import type { FixedExpense } from "@/types";
import { Card } from "@/components/ui/Card";

interface FixedExpenseDueBannerProps {
  expenses: FixedExpense[];
  onOpenFixedTab: () => void;
}

export function FixedExpenseDueBanner({
  expenses,
  onOpenFixedTab,
}: FixedExpenseDueBannerProps) {
  const due = sortFixedExpensesByUrgency(expenses).filter(
    (e) => getFixedExpenseStatus(e) === "due"
  );

  if (due.length === 0) return null;

  const totalDue = due.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Card className="border border-[var(--ios-red)]/30 bg-[var(--ios-red)]/5">
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={20}
          className="mt-0.5 shrink-0 text-[var(--ios-red)]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--ios-red)]">
            {due.length === 1
              ? "1 gasto fijo vencido"
              : `${due.length} gastos fijos vencidos`}
          </p>
          <p className="mt-0.5 text-xs text-[var(--ios-muted)]">
            Total pendiente: {formatDOP(totalDue)}
          </p>
          <ul className="mt-2 space-y-1">
            {due.slice(0, 3).map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="truncate font-medium">{expense.name}</span>
                <span className="shrink-0 text-[var(--ios-muted)]">
                  {formatDueLabel(expense)}
                </span>
              </li>
            ))}
            {due.length > 3 && (
              <li className="text-[11px] text-[var(--ios-muted)]">
                y {due.length - 3} más…
              </li>
            )}
          </ul>
          <button
            type="button"
            onClick={onOpenFixedTab}
            className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-[var(--ios-red)]/15 px-3 py-2.5 text-sm font-semibold text-[var(--ios-red)] transition-colors active:bg-[var(--ios-red)]/25"
          >
            Ver en Gastos fijos
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
