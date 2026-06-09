"use client";

import { Plus, Receipt } from "lucide-react";
import { getDailySummary, getTransactionsForDay } from "@/lib/budget/dailyStats";
import { formatDOP } from "@/lib/currency/format";
import type { Transaction } from "@/types";
import { TransactionRow } from "./TransactionRow";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface DailyExpensesCardProps {
  transactions: Transaction[];
  onAddExpense: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
}

export function DailyExpensesCard({
  transactions,
  onAddExpense,
  onEditTransaction,
  onRemoveTransaction,
}: DailyExpensesCardProps) {
  const summary = getDailySummary(transactions);
  const todayExpenses = getTransactionsForDay(transactions).filter(
    (tx) => tx.type === "expense"
  );

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ios-red)]/15 text-[var(--ios-red)]">
            <Receipt size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Gastos del día</h3>
            <p className="text-xs capitalize text-[var(--ios-muted)]">
              {summary.label}
            </p>
          </div>
        </div>
        <p className="text-lg font-bold text-[var(--ios-red)]">
          {formatDOP(summary.expenses)}
        </p>
      </div>

      {summary.income > 0 && (
        <p className="mb-2 text-xs text-[var(--ios-muted)]">
          Ingresos hoy:{" "}
          <span className="font-semibold text-[var(--ios-green)]">
            {formatDOP(summary.income)}
          </span>
        </p>
      )}

      {todayExpenses.length === 0 ? (
        <p className="text-sm text-[var(--ios-muted)]">
          Sin gastos hoy. Toca el botón para registrar comida, pasaje, etc.
        </p>
      ) : (
        <div className="mb-3 space-y-1.5">
          {todayExpenses.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              compact
              onEdit={onEditTransaction}
              onDelete={onRemoveTransaction}
            />
          ))}
        </div>
      )}

      <Button variant="secondary" fullWidth size="sm" onClick={onAddExpense}>
        <Plus size={16} />
        Agregar gasto del día
      </Button>
    </Card>
  );
}
