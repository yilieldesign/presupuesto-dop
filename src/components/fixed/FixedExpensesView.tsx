"use client";

import { formatDOP } from "@/lib/currency/format";
import {
  getFixedExpenseStatus,
  getMonthlyFixedTotal,
} from "@/lib/budget/fixedExpenses";
import type { ExpenseCategory, FixedExpense } from "@/types";
import type { NotificationPermissionState } from "@/lib/notifications/browser";
import { Card } from "@/components/ui/Card";
import { FixedExpensesCard } from "@/components/budget/FixedExpensesCard";

interface FixedExpensesViewProps {
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
        "nextPaymentDate" | "reminderEnabled" | "reminderDaysBefore"
      >
    >
  ) => void;
  onRemove: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onEnableNotifications: () => Promise<NotificationPermissionState>;
  onSetNotificationsEnabled: (enabled: boolean) => void;
}

export function FixedExpensesView({
  expenses,
  notificationsEnabled,
  notificationPermission,
  onAdd,
  onUpdate,
  onRemove,
  onMarkPaid,
  onEnableNotifications,
  onSetNotificationsEnabled,
}: FixedExpensesViewProps) {
  const monthlyTotal = getMonthlyFixedTotal(expenses);
  const dueCount = expenses.filter(
    (e) => getFixedExpenseStatus(e) === "due"
  ).length;
  const upcomingCount = expenses.filter((e) => {
    const status = getFixedExpenseStatus(e);
    return status === "upcoming";
  }).length;

  return (
    <div className="space-y-4 pb-4">
      <Card className="border border-[var(--ios-tint)]/15 bg-[var(--ios-tint)]/5">
        <p className="text-sm leading-relaxed text-[var(--ios-muted)]">
          Agenda alquiler, servicios y otros pagos con fecha. El{" "}
          <span className="font-medium text-[var(--ios-text)]">
            optimizador en Deudas
          </span>{" "}
          los incluye en compromisos urgentes antes de atacar deudas.
        </p>
      </Card>

      {expenses.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <Card padding="sm" className="text-center">
            <p className="text-[10px] text-[var(--ios-muted)]">Al mes</p>
            <p className="text-sm font-bold">{formatDOP(monthlyTotal)}</p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-[10px] text-[var(--ios-muted)]">Vencidos</p>
            <p
              className={`text-sm font-bold ${dueCount > 0 ? "text-[var(--ios-red)]" : "text-[var(--ios-green)]"}`}
            >
              {dueCount}
            </p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-[10px] text-[var(--ios-muted)]">Próximos</p>
            <p className="text-sm font-bold text-[var(--ios-orange)]">
              {upcomingCount}
            </p>
          </Card>
        </div>
      )}

      <FixedExpensesCard
        expenses={expenses}
        notificationsEnabled={notificationsEnabled}
        notificationPermission={notificationPermission}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onMarkPaid={onMarkPaid}
        onEnableNotifications={onEnableNotifications}
        onSetNotificationsEnabled={onSetNotificationsEnabled}
        standalone
      />
    </div>
  );
}
