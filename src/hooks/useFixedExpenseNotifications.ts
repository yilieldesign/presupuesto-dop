"use client";

import { useCallback, useEffect, useRef } from "react";
import { formatDOP } from "@/lib/currency/format";
import { getRemindersForToday } from "@/lib/budget/fixedExpenses";
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
  notificationsEnabled: boolean;
  onNotified: (expenseId: string, notifyKey: string) => void;
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

export function useFixedExpenseNotifications({
  hydrated,
  expenses,
  notificationsEnabled,
  onNotified,
}: UseFixedExpenseNotificationsOptions) {
  const onNotifiedRef = useRef(onNotified);
  onNotifiedRef.current = onNotified;

  const runCheck = useCallback(async () => {
    if (!hydrated || !notificationsEnabled) return;
    if (getNotificationPermission() !== "granted") return;

    const reminders = getRemindersForToday(expenses, true);

    for (const reminder of reminders) {
      const { expense, kind, notifyKey } = reminder;
      const { title, body } = buildReminderMessage(
        kind,
        expense.name,
        expense.amount,
        expense.reminderDaysBefore ?? 1
      );

      await showFixedExpenseReminder(title, body, `fixed-${expense.id}-${notifyKey}`);
      onNotifiedRef.current(expense.id, notifyKey);
    }
  }, [hydrated, expenses, notificationsEnabled]);

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
