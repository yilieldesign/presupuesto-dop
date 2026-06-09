"use client";

import { useState } from "react";
import { Plus, ArrowDownLeft, ArrowUpRight } from "lucide-react";
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
  FixedExpense,
  TransactionType,
  WeeklyFundItem,
} from "@/types";
import type { NotificationPermissionState } from "@/lib/notifications/browser";
import { getMonthlyFixedTotal } from "@/lib/budget/fixedExpenses";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { DebtProgressBar } from "./DebtProgressBar";
import { FixedExpensesCard } from "./FixedExpensesCard";
import { WeeklyFundCard } from "./WeeklyFundCard";

interface BudgetViewProps {
  state: AppState;
  onSetWeeklyFundItems: (items: WeeklyFundItem[]) => void;
  onAddTransaction: (tx: {
    type: TransactionType;
    amount: number;
    category?: ExpenseCategory;
    description: string;
  }) => void;
  onResetApp: () => void;
  onSetUserName: (name: string) => void;
  notificationPermission: NotificationPermissionState;
  onAddFixedExpense: (expense: {
    name: string;
    amount: number;
    category: ExpenseCategory;
    nextPaymentDate: string;
    reminderEnabled?: boolean;
    reminderDaysBefore?: number;
  }) => void;
  onUpdateFixedExpense: (
    id: string,
    patch: Partial<
      Pick<
        FixedExpense,
        "nextPaymentDate" | "reminderEnabled" | "reminderDaysBefore"
      >
    >
  ) => void;
  onRemoveFixedExpense: (id: string) => void;
  onMarkFixedExpensePaid: (id: string) => void;
  onEnableNotifications: () => Promise<NotificationPermissionState>;
  onSetFixedExpenseNotificationsEnabled: (enabled: boolean) => void;
}

export function BudgetView({
  state,
  onSetWeeklyFundItems,
  onAddTransaction,
  onResetApp,
  onSetUserName,
  notificationPermission,
  onAddFixedExpense,
  onUpdateFixedExpense,
  onRemoveFixedExpense,
  onMarkFixedExpensePaid,
  onEnableNotifications,
  onSetFixedExpenseNotificationsEnabled,
}: BudgetViewProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("comida");

  const weeklyIncome = getWeeklyIncome(state.transactions);
  const weeklyExpenses = getWeeklyExpenses(state.transactions);
  const injected = getTotalInjectedToDebts(state.injections);
  const monthlyFixed = getMonthlyFixedTotal(state.fixedExpenses);
  const weeklyNet = weeklyIncome - weeklyExpenses - injected;

  const recent = state.transactions.slice(0, 8);

  const handleSubmit = () => {
    const parsed = parseFloat(amount.replace(",", ".")) || 0;
    if (parsed <= 0) return;

    onAddTransaction({
      type: txType,
      amount: parsed,
      category: txType === "expense" ? category : undefined,
      description: description || (txType === "income" ? "Ingreso" : "Gasto"),
    });

    setAmount("");
    setDescription("");
    setSheetOpen(false);
  };

  return (
    <div className="relative space-y-4 pb-20">
      <DebtProgressBar state={state} />

      <WeeklyFundCard
        items={state.weeklyFundItems}
        categorySpent={state.weekFundCategorySpent}
        onSaveItems={onSetWeeklyFundItems}
      />

      <FixedExpensesCard
        expenses={state.fixedExpenses}
        notificationsEnabled={state.fixedExpenseNotificationsEnabled}
        notificationPermission={notificationPermission}
        onAdd={onAddFixedExpense}
        onUpdate={onUpdateFixedExpense}
        onRemove={onRemoveFixedExpense}
        onMarkPaid={onMarkFixedExpensePaid}
        onEnableNotifications={onEnableNotifications}
        onSetNotificationsEnabled={onSetFixedExpenseNotificationsEnabled}
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
        <p className="text-xs text-[var(--ios-muted)]">Balance semanal neto</p>
        <p
          className={`text-2xl font-bold ${weeklyNet >= 0 ? "text-[var(--ios-green)]" : "text-[var(--ios-red)]"}`}
        >
          {formatDOP(weeklyNet)}
        </p>
        {monthlyFixed > 0 && (
          <p className="mt-1 text-xs text-[var(--ios-muted)]">
            Compromiso fijo mensual: {formatDOP(monthlyFixed)}
          </p>
        )}
      </Card>

      <div>
        <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-[var(--ios-muted)]">
          Movimientos recientes
        </h3>
        {recent.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-[var(--ios-muted)]">
              Sin movimientos. Usa el botón + o el Optimizador en Deudas.
            </p>
          </Card>
        ) : (
          <div className="space-y-1">
            {recent.map((tx) => {
              const isIncome = tx.type === "income";
              const isDebt = tx.type === "debt_payment";
              const cat = EXPENSE_CATEGORIES.find((c) => c.id === tx.category);

              return (
                <Card key={tx.id} padding="sm">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isIncome
                          ? "bg-[var(--ios-green)]/15 text-[var(--ios-green)]"
                          : isDebt
                            ? "bg-[var(--ios-tint)]/15 text-[var(--ios-tint)]"
                            : "bg-[var(--ios-red)]/15 text-[var(--ios-red)]"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {tx.description}
                      </p>
                      <p className="text-xs text-[var(--ios-muted)]">
                        {isDebt
                          ? "Pago a deuda"
                          : cat?.label ?? new Date(tx.date).toLocaleDateString("es-DO")}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-semibold ${
                        isIncome
                          ? "text-[var(--ios-green)]"
                          : "text-[var(--ios-text)]"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatDOP(tx.amount)}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
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
            <h3 className="mb-4 text-lg font-bold">Nuevo movimiento</h3>

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

            <div className="space-y-3">
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
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setSheetOpen(false)}
                >
                  Cancelar
                </Button>
                <Button fullWidth onClick={handleSubmit}>
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
