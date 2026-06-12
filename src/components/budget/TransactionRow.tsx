"use client";

import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/budget/categories";
import { formatDOP } from "@/lib/currency/format";
import type { Transaction } from "@/types";
import { Card } from "@/components/ui/Card";

interface TransactionRowProps {
  tx: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function TransactionRow({
  tx,
  onEdit,
  onDelete,
  compact = false,
}: TransactionRowProps) {
  const isIncome = tx.type === "income";
  const isDebt = tx.type === "debt_payment";
  const editable = !isDebt && onEdit && onDelete;
  const cat = EXPENSE_CATEGORIES.find((c) => c.id === tx.category);

  const content = (
    <div className="flex items-center gap-3">
      {!compact && (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isIncome
              ? "bg-[var(--ios-green)]/15 text-[var(--ios-green)]"
              : isDebt
                ? "bg-[var(--ios-tint)]/15 text-[var(--ios-tint)]"
                : "bg-[var(--ios-red)]/15 text-[var(--ios-red)]"
          }`}
        >
          {isIncome ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{tx.description}</p>
        <p className="text-xs text-[var(--ios-muted)]">
          {isDebt
            ? "Pago a deuda"
            : cat?.label ??
              new Date(tx.date).toLocaleDateString("es-DO", {
                day: "numeric",
                month: "short",
              })}
        </p>
      </div>
      <p
        className={`shrink-0 text-sm font-semibold ${
          isIncome ? "text-[var(--ios-green)]" : "text-[var(--ios-text)]"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatDOP(tx.amount)}
      </p>
      {editable && (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(tx)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ios-tint)]/10 text-[var(--ios-tint)]"
            aria-label={`Editar ${tx.description}`}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `¿Eliminar "${tx.description}" por ${formatDOP(tx.amount)}?`
                )
              ) {
                onDelete(tx.id);
              }
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ios-red)]/10 text-[var(--ios-red)]"
            aria-label={`Eliminar ${tx.description}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="rounded-xl bg-[var(--ios-bg)] px-3 py-2">{content}</div>
    );
  }

  return <Card padding="sm">{content}</Card>;
}
