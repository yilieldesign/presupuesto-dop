"use client";

import { useState } from "react";
import {
  Bell,
  BellOff,
  CalendarClock,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/budget/categories";
import {
  computeNextPaymentDateFromDay,
  formatDueLabel,
  formatPaymentDate,
  getFixedExpenseStatus,
  getMonthlyFixedTotal,
  sortFixedExpensesByUrgency,
  toDateKey,
} from "@/lib/budget/fixedExpenses";
import { formatDOP, parseMoneyInput } from "@/lib/currency/format";
import type { ExpenseCategory, FixedExpense } from "@/types";
import type { NotificationPermissionState } from "@/lib/notifications/browser";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";

interface FixedExpensesCardProps {
  expenses: FixedExpense[];
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermissionState;
  onAdd: (expense: {
    name: string;
    amount: number;
    category: ExpenseCategory;
    nextPaymentDate: string;
    reminderEnabled?: boolean;
    reminderDaysBefore?: number;
  }) => void;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<
        FixedExpense,
        | "nextPaymentDate"
        | "reminderEnabled"
        | "reminderDaysBefore"
      >
    >
  ) => void;
  onRemove: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onEnableNotifications: () => Promise<NotificationPermissionState>;
  onSetNotificationsEnabled: (enabled: boolean) => void;
}

const STATUS_STYLES = {
  due: "bg-[var(--ios-red)]/15 text-[var(--ios-red)]",
  upcoming: "bg-[var(--ios-orange)]/15 text-[var(--ios-orange)]",
  paid: "bg-[var(--ios-green)]/15 text-[var(--ios-green)]",
} as const;

const REMINDER_OPTIONS = [
  { value: 0, label: "El mismo día" },
  { value: 1, label: "1 día antes" },
  { value: 3, label: "3 días antes" },
  { value: 7, label: "7 días antes" },
] as const;

function defaultPaymentDate(): string {
  return computeNextPaymentDateFromDay(new Date().getDate());
}

export function FixedExpensesCard({
  expenses,
  notificationsEnabled,
  notificationPermission,
  onAdd,
  onUpdate,
  onRemove,
  onMarkPaid,
  onEnableNotifications,
  onSetNotificationsEnabled,
}: FixedExpensesCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("servicios");
  const [paymentDate, setPaymentDate] = useState(defaultPaymentDate);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(1);
  const [enabling, setEnabling] = useState(false);

  const sorted = sortFixedExpensesByUrgency(expenses);
  const monthlyTotal = getMonthlyFixedTotal(expenses);
  const dueCount = expenses.filter(
    (e) => getFixedExpenseStatus(e) === "due"
  ).length;

  const showNotificationPrompt =
    notificationsEnabled &&
    notificationPermission !== "granted" &&
    notificationPermission !== "unsupported" &&
    expenses.length > 0;

  const handleAdd = () => {
    const parsedAmount = parseMoneyInput(amount);
    if (!name.trim() || parsedAmount <= 0 || !paymentDate) return;

    onAdd({
      name: name.trim(),
      amount: parsedAmount,
      category,
      nextPaymentDate: paymentDate,
      reminderEnabled: true,
      reminderDaysBefore,
    });

    setName("");
    setAmount("");
    setPaymentDate(defaultPaymentDate());
    setReminderDaysBefore(1);
    setEditing(false);
  };

  const handleEnableNotifications = async () => {
    setEnabling(true);
    try {
      await onEnableNotifications();
    } finally {
      setEnabling(false);
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ios-tint)]/15 text-[var(--ios-tint)]">
            <CalendarClock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Gastos fijos</h3>
            <p className="text-xs text-[var(--ios-muted)]">
              {expenses.length === 0
                ? "Agenda alquiler, internet y más"
                : `${formatDOP(monthlyTotal)}/mes · ${dueCount > 0 ? `${dueCount} por pagar` : "Al día"}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-full bg-[var(--ios-bg)] px-3 py-1.5 text-xs font-medium text-[var(--ios-tint)]"
        >
          {editing ? "Cerrar" : expenses.length === 0 ? "Agregar" : "Nuevo"}
        </button>
      </div>

      {showNotificationPrompt && (
        <div className="mt-3 rounded-2xl bg-[var(--ios-tint)]/10 p-3">
          <div className="flex items-start gap-2">
            <Bell size={16} className="mt-0.5 shrink-0 text-[var(--ios-tint)]" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--ios-tint)]">
                Activa recordatorios
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--ios-muted)]">
                Te avisamos el día del pago o días antes. En iPhone, agrega la app
                a la pantalla de inicio.
              </p>
              <Button
                size="sm"
                className="mt-2"
                onClick={handleEnableNotifications}
                disabled={enabling}
              >
                {enabling ? "Activando…" : "Permitir notificaciones"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {notificationPermission === "denied" && expenses.length > 0 && (
        <p className="mt-2 text-[11px] text-[var(--ios-orange)]">
          Notificaciones bloqueadas. Actívalas en Ajustes del navegador o del
          teléfono.
        </p>
      )}

      {editing && (
        <div className="mt-4 space-y-3 rounded-2xl bg-[var(--ios-bg)] p-3">
          <input
            type="text"
            placeholder="Nombre (ej. Alquiler, Internet)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--ios-separator)] bg-[var(--ios-card)] px-4 py-3 text-sm outline-none"
          />
          <MoneyInput value={amount} onChange={setAmount} />
          <div>
            <label className="mb-1 block text-xs text-[var(--ios-muted)]">
              Fecha de pago
            </label>
            <input
              type="date"
              value={paymentDate}
              min={toDateKey(new Date())}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--ios-separator)] bg-[var(--ios-card)] px-4 py-3 text-sm outline-none"
            />
            <p className="mt-1 text-[10px] text-[var(--ios-muted)]">
              Se repite cada mes en el mismo día
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--ios-muted)]">
              Recordatorio
            </label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReminderDaysBefore(opt.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    reminderDaysBefore === opt.value
                      ? "bg-[var(--ios-tint)] text-white"
                      : "bg-[var(--ios-card)] text-[var(--ios-muted)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === c.id
                    ? "bg-[var(--ios-tint)] text-white"
                    : "bg-[var(--ios-card)] text-[var(--ios-muted)]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <Button fullWidth onClick={handleAdd}>
            <Plus size={16} className="mr-1 inline" />
            Agendar gasto fijo
          </Button>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="mt-4 space-y-2">
          {sorted.map((expense) => {
            const status = getFixedExpenseStatus(expense);
            const cat = EXPENSE_CATEGORIES.find((c) => c.id === expense.category);
            const reminderOn = expense.reminderEnabled !== false;

            return (
              <div
                key={expense.id}
                className="rounded-2xl bg-[var(--ios-bg)] p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{expense.name}</p>
                    <p className="text-xs text-[var(--ios-muted)]">
                      {cat?.label ?? expense.category} ·{" "}
                      {formatPaymentDate(expense)}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[status]}`}
                    >
                      {formatDueLabel(expense)}
                    </span>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">
                    {formatDOP(expense.amount)}
                  </p>
                  <div className="flex shrink-0 flex-col gap-1">
                    {status !== "paid" && (
                      <button
                        type="button"
                        onClick={() => onMarkPaid(expense.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ios-green)]/15 text-[var(--ios-green)]"
                        aria-label={`Marcar ${expense.name} como pagado`}
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`¿Eliminar "${expense.name}"?`)) {
                          onRemove(expense.id);
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ios-red)]/10 text-[var(--ios-red)]"
                      aria-label={`Eliminar ${expense.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[var(--ios-separator)]/50 pt-2">
                  <input
                    type="date"
                    value={expense.nextPaymentDate}
                    min={toDateKey(new Date())}
                    onChange={(e) =>
                      onUpdate(expense.id, {
                        nextPaymentDate: e.target.value,
                      })
                    }
                    className="rounded-lg border border-[var(--ios-separator)] bg-[var(--ios-card)] px-2 py-1 text-[11px] outline-none"
                    aria-label={`Cambiar fecha de pago de ${expense.name}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate(expense.id, {
                        reminderEnabled: !reminderOn,
                      })
                    }
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium ${
                      reminderOn
                        ? "bg-[var(--ios-tint)]/15 text-[var(--ios-tint)]"
                        : "bg-[var(--ios-bg)] text-[var(--ios-muted)]"
                    }`}
                  >
                    {reminderOn ? <Bell size={12} /> : <BellOff size={12} />}
                    {reminderOn ? "Recordatorio on" : "Sin aviso"}
                  </button>
                  {reminderOn && (
                    <select
                      value={expense.reminderDaysBefore ?? 1}
                      onChange={(e) =>
                        onUpdate(expense.id, {
                          reminderDaysBefore: Number(e.target.value),
                        })
                      }
                      className="rounded-lg border border-[var(--ios-separator)] bg-[var(--ios-card)] px-2 py-1 text-[10px] outline-none"
                    >
                      {REMINDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {expenses.length > 0 && notificationPermission === "granted" && (
        <button
          type="button"
          onClick={() => onSetNotificationsEnabled(!notificationsEnabled)}
          className="mt-3 w-full text-center text-[11px] text-[var(--ios-muted)] underline-offset-2 hover:underline"
        >
          {notificationsEnabled
            ? "Desactivar todos los recordatorios"
            : "Activar recordatorios globales"}
        </button>
      )}
    </Card>
  );
}
