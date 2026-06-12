"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { formatDOP } from "@/lib/currency/format";
import { EXPENSE_CATEGORIES } from "@/lib/budget/categories";
import {
  getWeeklyExpenses,
  getWeeklyIncome,
  getTotalInjectedToDebts,
} from "@/lib/budget/stats";
import type {
  AppState,
  ExpenseCategory,
  Transaction,
  TransactionType,
  WeeklyFundItem,
} from "@/types";
import { TransactionRow } from "./TransactionRow";
import { toDateKey } from "@/lib/budget/fixedExpenses";
import { getCurrentMonthSummary } from "@/lib/budget/monthlyStats";
import { DailyExpensesCard } from "./DailyExpensesCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { DebtProgressBar } from "./DebtProgressBar";
import { WeeklyFundCard } from "./WeeklyFundCard";
import { FixedExpenseDueBanner } from "./FixedExpenseDueBanner";

interface BudgetViewProps {
  state: AppState;
  onSetWeeklyFundItems: (items: WeeklyFundItem[]) => void;
  onAddTransaction: (tx: {
    type: TransactionType;
    amount: number;
    category?: ExpenseCategory;
    description: string;
    date?: string;
  }) => void;
  onUpdateTransaction: (
    id: string,
    patch: {
      type: "expense" | "income";
      amount: number;
      description: string;
      category?: ExpenseCategory;
      date: string;
    }
  ) => void;
  onRemoveTransaction: (id: string) => void;
  onResetApp: () => void;
  onSetUserName: (name: string) => void;
  onOpenFixedTab: () => void;
}

export function BudgetView({
  state,
  onSetWeeklyFundItems,
  onAddTransaction,
  onUpdateTransaction,
  onRemoveTransaction,
  onResetApp,
  onSetUserName,
  onOpenFixedTab,
}: BudgetViewProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("comida");
  const [txDate, setTxDate] = useState(toDateKey(new Date()));
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setTxDate(toDateKey(new Date()));
    setCategory("comida");
    setEditingTxId(null);
  };

  const openExpenseSheet = () => {
    resetForm();
    setTxType("expense");
    setSheetOpen(true);
  };

  const openEditTransaction = (tx: Transaction) => {
    if (tx.type === "debt_payment") return;
    setEditingTxId(tx.id);
    setTxType(tx.type);
    setAmount(String(tx.amount));
    setDescription(tx.description);
    setCategory(tx.category ?? "comida");
    setTxDate(toDateKey(new Date(tx.date)));
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    resetForm();
  };

  const weeklyIncome = getWeeklyIncome(state.transactions);
  const weeklyExpenses = getWeeklyExpenses(state.transactions);
  const injected = getTotalInjectedToDebts(state.injections);
  const monthSummary = getCurrentMonthSummary(state.transactions);
  const weeklyNet = weeklyIncome - weeklyExpenses - injected;

  const recent = state.transactions.slice(0, 8);

  const handleSubmit = () => {
    const parsed = parseFloat(amount.replace(",", ".")) || 0;
    if (parsed <= 0) return;

    const dateIso = new Date(`${txDate}T12:00:00`).toISOString();
    const payload = {
      type: txType,
      amount: parsed,
      category: txType === "expense" ? category : undefined,
      description: description || (txType === "income" ? "Ingreso" : "Gasto"),
      date: dateIso,
    };

    if (editingTxId) {
      onUpdateTransaction(editingTxId, payload);
    } else {
      onAddTransaction(payload);
    }

    closeSheet();
  };

  return (
    <div className="relative space-y-4 pb-20">
      <FixedExpenseDueBanner
        expenses={state.fixedExpenses}
        onOpenFixedTab={onOpenFixedTab}
      />

      <DebtProgressBar state={state} />

      <WeeklyFundCard
        items={state.weeklyFundItems}
        categorySpent={state.weekFundCategorySpent}
        onSaveItems={onSetWeeklyFundItems}
      />

      <DailyExpensesCard
        transactions={state.transactions}
        onAddExpense={openExpenseSheet}
        onEditTransaction={openEditTransaction}
        onRemoveTransaction={onRemoveTransaction}
      />

      <div className="grid grid-cols-3 gap-2">
        <Card padding="sm" className="text-center">
          <p className="text-[10px] text-[var(--ios-muted)]">Ingresos 7d</p>
          <p className="text-sm font-bold text-[var(--ios-green)]">
            {formatDOP(weeklyIncome)}
          </p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-[10px] text-[var(--ios-muted)]">Gastos 7d</p>
          <p className="text-sm font-bold text-[var(--ios-red)]">
            {formatDOP(weeklyExpenses)}
          </p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-[10px] text-[var(--ios-muted)]">A deudas 7d</p>
          <p className="text-sm font-bold text-[var(--ios-tint)]">
            {formatDOP(injected)}
          </p>
        </Card>
      </div>

      <Card>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--ios-muted)]">
          Este mes
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-[var(--ios-muted)]">Ganado</p>
            <p className="text-sm font-bold text-[var(--ios-green)]">
              {formatDOP(monthSummary.income)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--ios-muted)]">Pagado</p>
            <p className="text-sm font-bold text-[var(--ios-red)]">
              {formatDOP(monthSummary.totalPaid)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[var(--ios-muted)]">Balance</p>
            <p
              className={`text-sm font-bold ${
                monthSummary.net >= 0
                  ? "text-[var(--ios-green)]"
                  : "text-[var(--ios-red)]"
              }`}
            >
              {formatDOP(monthSummary.net)}
            </p>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] capitalize text-[var(--ios-muted)]">
          {monthSummary.label} · detalle en Progreso
        </p>
      </Card>

      <Card>
        <p className="text-xs text-[var(--ios-muted)]">Balance semanal neto</p>
        <p
          className={`text-2xl font-bold ${weeklyNet >= 0 ? "text-[var(--ios-green)]" : "text-[var(--ios-red)]"}`}
        >
          {formatDOP(weeklyNet)}
        </p>
      </Card>

      <div>
        <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-[var(--ios-muted)]">
          Movimientos recientes
        </h3>
        {recent.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-[var(--ios-muted)]">
              Sin movimientos. Agrega un gasto del día con + o el Optimizador en Deudas.
            </p>
          </Card>
        ) : (
          <div className="space-y-1">
            {recent.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onEdit={
                  tx.type !== "debt_payment" ? openEditTransaction : undefined
                }
                onDelete={
                  tx.type !== "debt_payment" ? onRemoveTransaction : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={openExpenseSheet}
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ios-tint)] text-white shadow-lg transition-transform active:scale-90"
        style={{ marginBottom: "var(--safe-area-bottom)" }}
        aria-label="Añadir movimiento"
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <div className="space-y-2 pt-6 pb-2 text-center">
        <button
          type="button"
          onClick={() => {
            const next = window.prompt(
              "Tu nombre",
              state.userName || ""
            );
            if (next !== null && next.trim()) {
              onSetUserName(next.trim());
            }
          }}
          className="block w-full text-xs text-[var(--ios-muted)] underline-offset-2 hover:underline"
        >
          {state.userName
            ? `Cambiar nombre (${state.userName})`
            : "Agregar tu nombre"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "¿Borrar todos los datos y empezar de cero? Esta acción no se puede deshacer."
              )
            ) {
              onResetApp();
            }
          }}
          className="text-xs text-[var(--ios-muted)] underline-offset-2 hover:underline"
        >
          Reiniciar aplicación
        </button>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm">
          <div
            className="w-full max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-[var(--ios-card)] p-5"
            style={{ paddingBottom: "max(20px, var(--safe-area-bottom))" }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--ios-separator)]" />
            <h3 className="mb-4 text-lg font-bold">
              {editingTxId
                ? "Editar movimiento"
                : txType === "expense"
                  ? "Gasto del día"
                  : "Nuevo ingreso"}
            </h3>

            {!editingTxId && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxType(t)}
                    className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
                      txType === t
                        ? "bg-[var(--ios-tint)] text-white"
                        : "bg-[var(--ios-bg)] text-[var(--ios-muted)]"
                    }`}
                  >
                    {t === "expense" ? "Gasto" : "Ingreso"}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-[var(--ios-muted)]">
                  Fecha
                </label>
                <input
                  type="date"
                  value={txDate}
                  max={toDateKey(new Date())}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--ios-separator)] bg-[var(--ios-bg)] px-4 py-3 text-sm outline-none"
                />
              </div>
              <MoneyInput value={amount} onChange={setAmount} autoFocus />
              <input
                type="text"
                placeholder="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-[var(--ios-separator)] bg-[var(--ios-bg)] px-4 py-3 text-sm outline-none"
              />
              {txType === "expense" && (
                <div className="flex flex-wrap gap-2">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        category === c.id
                          ? "bg-[var(--ios-tint)] text-white"
                          : "bg-[var(--ios-bg)] text-[var(--ios-muted)]"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" fullWidth onClick={closeSheet}>
                  Cancelar
                </Button>
                <Button fullWidth onClick={handleSubmit}>
                  {editingTxId ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
