import type { FixedExpense } from "@/types";

export function getMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Día efectivo del mes (ej. 31 → 28 en febrero). */
export function getEffectiveDay(
  year: number,
  month: number,
  dayOfMonth: number
): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(1, dayOfMonth), daysInMonth);
}

/** Calcula la próxima fecha de pago a partir del día del mes. */
export function computeNextPaymentDateFromDay(
  dayOfMonth: number,
  now: Date = new Date()
): string {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = getEffectiveDay(year, month, dayOfMonth);
  const candidate = new Date(year, month, day);
  const today = startOfDay(now);

  if (candidate >= today) {
    return toDateKey(candidate);
  }

  const nextMonth = month + 1;
  const nextDay = getEffectiveDay(
    nextMonth > 11 ? year + 1 : year,
    nextMonth % 12,
    dayOfMonth
  );
  const nextDate = new Date(
    nextMonth > 11 ? year + 1 : year,
    nextMonth % 12,
    nextDay
  );
  return toDateKey(nextDate);
}

export function dayOfMonthFromDateKey(key: string): number {
  return parseDateKey(key).getDate();
}

export function getPaymentDate(expense: FixedExpense): Date {
  if (expense.nextPaymentDate) {
    return parseDateKey(expense.nextPaymentDate);
  }
  const now = new Date();
  const day = getEffectiveDay(
    now.getFullYear(),
    now.getMonth(),
    expense.dayOfMonth
  );
  return new Date(now.getFullYear(), now.getMonth(), day);
}

export function advancePaymentDate(
  currentKey: string,
  dayOfMonth: number
): string {
  const current = parseDateKey(currentKey);
  const nextMonth = current.getMonth() + 1;
  const year = nextMonth > 11 ? current.getFullYear() + 1 : current.getFullYear();
  const month = nextMonth % 12;
  const day = getEffectiveDay(year, month, dayOfMonth);
  return toDateKey(new Date(year, month, day));
}

export function isPaidThisMonth(
  expense: FixedExpense,
  monthKey: string = getMonthKey()
): boolean {
  return expense.lastPaidMonthKey === monthKey;
}

export type FixedExpenseStatus = "paid" | "due" | "upcoming";

export function getFixedExpenseStatus(
  expense: FixedExpense,
  now: Date = new Date()
): FixedExpenseStatus {
  const monthKey = getMonthKey(now);
  if (isPaidThisMonth(expense, monthKey)) return "paid";

  const dueDate = getPaymentDate(expense);
  const today = startOfDay(now);

  return today >= dueDate ? "due" : "upcoming";
}

export function daysUntilDue(
  expense: FixedExpense,
  now: Date = new Date()
): number {
  const dueDate = getPaymentDate(expense);
  const today = startOfDay(now);
  const diff = dueDate.getTime() - today.getTime();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function formatPaymentDate(
  expense: FixedExpense,
  now: Date = new Date()
): string {
  const date = getPaymentDate(expense);
  return date.toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatDueLabel(
  expense: FixedExpense,
  now: Date = new Date()
): string {
  const status = getFixedExpenseStatus(expense, now);
  if (status === "paid") return "Pagado este mes";
  if (status === "due") {
    const days = Math.abs(daysUntilDue(expense, now));
    return days === 0 ? "Vence hoy" : `Vencido hace ${days}d`;
  }
  const days = daysUntilDue(expense, now);
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días · ${formatPaymentDate(expense, now)}`;
}

export function getMonthlyFixedTotal(expenses: FixedExpense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function sortFixedExpensesByUrgency(
  expenses: FixedExpense[],
  now: Date = new Date()
): FixedExpense[] {
  return [...expenses].sort((a, b) => {
    const order = { due: 0, upcoming: 1, paid: 2 };
    const sa = order[getFixedExpenseStatus(a, now)];
    const sb = order[getFixedExpenseStatus(b, now)];
    if (sa !== sb) return sa - sb;
    return daysUntilDue(a, now) - daysUntilDue(b, now);
  });
}

export type ReminderKind = "due_today" | "due_soon";

export interface FixedExpenseReminder {
  expense: FixedExpense;
  kind: ReminderKind;
  notifyKey: string;
}

/** Gastos que deben recibir recordatorio hoy. */
export function getRemindersForToday(
  expenses: FixedExpense[],
  globalEnabled: boolean,
  now: Date = new Date()
): FixedExpenseReminder[] {
  if (!globalEnabled) return [];

  const todayKey = toDateKey(startOfDay(now));
  const results: FixedExpenseReminder[] = [];

  for (const expense of expenses) {
    if (expense.reminderEnabled === false) continue;
    if (getFixedExpenseStatus(expense, now) === "paid") continue;
    if (expense.lastNotifiedKey === todayKey) continue;

    const daysBefore = expense.reminderDaysBefore ?? 1;
    const daysLeft = daysUntilDue(expense, now);

    if (daysLeft === 0) {
      results.push({
        expense,
        kind: "due_today",
        notifyKey: todayKey,
      });
    } else if (daysLeft === daysBefore) {
      results.push({
        expense,
        kind: "due_soon",
        notifyKey: todayKey,
      });
    }
  }

  return results;
}
