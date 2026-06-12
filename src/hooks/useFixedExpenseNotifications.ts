"use client";

import { useCallback, useEffect, useRef } from "react";
import { formatDOP } from "@/lib/currency/format";
import { getRemindersForToday } from "@/lib/budget/fixedExpenses";
import {
  getDebtRemindersForToday,
  type SchedulableDebt,
} from "@/lib/debt/debtSchedule";
import { formatMoney } from "@/lib/currency/format";
import type { Debt } from "@/types";
import {
  getNotificationPermission,
  isNotificationSupported,
  registerServiceWorker,
  requestNotificationPermission,
  showFixedExpenseReminder,
} from "@/lib/notifications/browser";
import type { FixedExpense } from "@/types";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

interface UseFixedExpenseNotificationsOptions {
  hydrated: boolean;
  expenses: FixedExpense[];
  debts: Debt[];
  notificationsEnabled: boolean;
  onExpenseNotified: (expenseId: string, notifyKey: string) => void;
  onDebtNotified: (debtId: string, notifyKey: string) => void;
}

function buildReminderMessage(
  kind: "due_today" | "due_soon",
  name: string,
  amount: number,
  daysBefore: number
): { title: string; body: string } {
  if (kind === "due_today") {
    return {
      title: `Pago hoy: ${name}`,
      body: `Vence hoy por ${formatDOP(amount)}. Ábrelo para marcarlo como pagado.`,
    };
  }

  const when =
    daysBefore === 1 ? "mañana" : `en ${daysBefore} días`;

  return {
    title: `Recordatorio: ${name}`,
    body: `Pago ${when} por ${formatDOP(amount)}.`,
  };
}

function buildDebtReminderMessage(
  kind: "due_today" | "due_soon",
  debt: SchedulableDebt
): { title: string; body: string } {
  const minimum = formatMoney(debt.minimumPayment, debt.currency);
  if (kind === "due_today") {
    return {
      title: `Pago de deuda hoy: ${debt.name}`,
      body: `Cubre el mínimo de ${minimum} antes de la fecha límite.`,
    };
  }
  return {
    title: `Próximo pago: ${debt.name}`,
    body: `Recuerda el mínimo de ${minimum}. Planifica con anticipación.`,
  };
}

export function useFixedExpenseNotifications({
  hydrated,
  expenses,
  debts,
  notificationsEnabled,
  onExpenseNotified,
  onDebtNotified,
}: UseFixedExpenseNotificationsOptions) {
  const onExpenseNotifiedRef = useRef(onExpenseNotified);
  const onDebtNotifiedRef = useRef(onDebtNotified);
  onExpenseNotifiedRef.current = onExpenseNotified;
  onDebtNotifiedRef.current = onDebtNotified;

  const runCheck = useCallback(async () => {
    if (!hydrated || !notificationsEnabled) return;
    if (getNotificationPermission() !== "granted") return;

    const expenseReminders = getRemindersForToday(expenses, true);
    for (const reminder of expenseReminders) {
      const { expense, kind, notifyKey } = reminder;
      const { title, body } = buildReminderMessage(
        kind,
        expense.name,
        expense.amount,
        expense.reminderDaysBefore ?? 1
      );

      await showFixedExpenseReminder(title, body, `fixed-${expense.id}-${notifyKey}`);
      onExpenseNotifiedRef.current(expense.id, notifyKey);
    }

    const debtReminders = getDebtRemindersForToday(debts, true);
    for (const reminder of debtReminders) {
      const { debt, kind, notifyKey } = reminder;
      const { title, body } = buildDebtReminderMessage(kind, debt);
      await showFixedExpenseReminder(title, body, `debt-${debt.id}-${notifyKey}`);
      onDebtNotifiedRef.current(debt.id, notifyKey);
    }
  }, [hydrated, expenses, debts, notificationsEnabled]);

  useEffect(() => {
    if (!hydrated) return;
    registerServiceWorker();
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    runCheck();

    const interval = window.setInterval(runCheck, CHECK_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        runCheck();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hydrated, runCheck]);

  const enableNotifications = useCallback(async () => {
    if (!isNotificationSupported()) {
      return "unsupported" as const;
    }

    await registerServiceWorker();
    const permission = await requestNotificationPermission();

    if (permission === "granted") {
      await runCheck();
    }

    return permission;
  }, [runCheck]);

  return {
    permission: hydrated ? getNotificationPermission() : "default",
    isSupported: isNotificationSupported(),
    enableNotifications,
  };
}
