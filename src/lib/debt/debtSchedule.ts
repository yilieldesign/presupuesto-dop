import {
  advancePaymentDate,
  computeNextPaymentDateFromDay,
  dayOfMonthFromDateKey,
  getMonthKey,
  parseDateKey,
  startOfDay,
  toDateKey,
} from "@/lib/budget/fixedExpenses";
import { toDOP } from "@/lib/currency/convert";
import type { Debt, DebtPaymentPriority, DebtStrategy } from "@/types";
import { sortDebtsByStrategy, isDebtActive } from "./strategies";
import type { SimDebt } from "./types";

export type DebtDueStatus = "paid" | "due" | "upcoming" | "flexible";

export interface SchedulableDebt {
  id: string;
  name: string;
  currency: Debt["currency"];
  balance: number;
  interestRate: number;
  minimumPayment: number;
  minimumPaymentMonthKey?: string;
  paymentPriority: DebtPaymentPriority;
  nextPaymentDate?: string;
  dayOfMonth?: number;
  lastPaidMonthKey?: string;
  lastNotifiedKey?: string;
}

export function isScheduledDebt(debt: SchedulableDebt): boolean {
  return (
    debt.paymentPriority === "scheduled" &&
    typeof debt.nextPaymentDate === "string" &&
    debt.nextPaymentDate.length > 0
  );
}

export function getDebtDueDate(debt: SchedulableDebt): Date | null {
  if (!isScheduledDebt(debt) || !debt.nextPaymentDate) return null;
  return parseDateKey(debt.nextPaymentDate);
}

export function getDebtDueStatus(
  debt: SchedulableDebt,
  now: Date = new Date()
): DebtDueStatus | "flexible" {
  if (!isScheduledDebt(debt) || !debt.nextPaymentDate) return "flexible";

  const monthKey = getMonthKey(now);
  if (debt.lastPaidMonthKey === monthKey) return "paid";

  const dueDate = parseDateKey(debt.nextPaymentDate);
  const today = startOfDay(now);
  return today >= dueDate ? "due" : "upcoming";
}

export function daysUntilDebtDue(
  debt: SchedulableDebt,
  now: Date = new Date()
): number | null {
  if (!isScheduledDebt(debt) || !debt.nextPaymentDate) return null;
  const dueDate = parseDateKey(debt.nextPaymentDate);
  const today = startOfDay(now);
  return Math.ceil((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

export function formatDebtDueLabel(
  debt: SchedulableDebt,
  now: Date = new Date()
): string {
  if (!isScheduledDebt(debt)) return "Sin fecha — paga al paso";
  const status = getDebtDueStatus(debt, now);
  if (status === "paid") return "Mínimo cubierto este mes";
  if (status === "due") {
    const days = Math.abs(daysUntilDebtDue(debt, now) ?? 0);
    return days === 0 ? "¡Paga hoy!" : `Vencida hace ${days}d`;
  }
  const days = daysUntilDebtDue(debt, now) ?? 0;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  const formatted = parseDateKey(debt.nextPaymentDate!).toLocaleDateString(
    "es-DO",
    {
      day: "numeric",
      month: "short",
      year:
        parseDateKey(debt.nextPaymentDate!).getFullYear() !== now.getFullYear()
          ? "numeric"
          : undefined,
    }
  );
  return `Vence en ${days}d · ${formatted}`;
}

/** Ordena deudas con fecha por urgencia (vencidas primero). */
export function sortScheduledDebtsByUrgency(
  debts: SchedulableDebt[],
  now: Date = new Date()
): SchedulableDebt[] {
  return [...debts]
    .filter(isScheduledDebt)
    .sort((a, b) => {
      const order = { due: 0, upcoming: 1, paid: 2, flexible: 3 };
      const sa = order[getDebtDueStatus(a, now)];
      const sb = order[getDebtDueStatus(b, now)];
      if (sa !== sb) return sa - sb;
      return (daysUntilDebtDue(a, now) ?? 99) - (daysUntilDebtDue(b, now) ?? 99);
    });
}

export interface DebtPaymentAlert {
  debt: SchedulableDebt;
  status: DebtDueStatus;
  daysUntil: number;
  message: string;
}

/** Avisos "paga antes" para deudas con fecha. */
export function getDebtPaymentAlerts(
  debts: SchedulableDebt[],
  now: Date = new Date(),
  warnWithinDays = 7
): DebtPaymentAlert[] {
  return sortScheduledDebtsByUrgency(debts, now)
    .filter((debt) => {
      const status = getDebtDueStatus(debt, now);
      if (status === "paid") return false;
      const days = daysUntilDebtDue(debt, now) ?? 99;
      return status === "due" || days <= warnWithinDays;
    })
    .map((debt) => {
      const status = getDebtDueStatus(debt, now) as DebtDueStatus;
      const daysUntil = daysUntilDebtDue(debt, now) ?? 0;
      let message: string;
      if (status === "due") {
        message = "Prioridad: cubre el mínimo cuanto antes";
      } else if (daysUntil <= 1) {
        message = "Paga adelantado para no atrasarte";
      } else {
        message = `Planifica el pago en los próximos ${daysUntil} días`;
      }
      return { debt, status, daysUntil, message };
    });
}

/**
 * Deuda prioritaria para inyección extra:
 * 1. Con fecha vencida o próxima (≤7 días)
 * 2. Si no hay urgencia, estrategia bola de nieve/avalancha en flexibles
 */
export function getExtraInjectionPriority(
  debts: SimDebt[],
  strategy: DebtStrategy,
  exchangeRate: number,
  scheduleById: Map<string, SchedulableDebt>,
  now: Date = new Date(),
  urgentWithinDays = 7
): { debt: SimDebt | null; byDueDate: boolean } {
  const active = debts.filter(isDebtActive);
  if (active.length === 0) return { debt: null, byDueDate: false };

  const urgentScheduled = sortScheduledDebtsByUrgency(
    active
      .map((d) => scheduleById.get(d.id))
      .filter((d): d is SchedulableDebt => !!d && isScheduledDebt(d)),
    now
  ).filter((debt) => {
    const status = getDebtDueStatus(debt, now);
    if (status === "paid") return false;
    const days = daysUntilDebtDue(debt, now) ?? 99;
    return status === "due" || days <= urgentWithinDays;
  });

  if (urgentScheduled.length > 0) {
    const pick = urgentScheduled[0];
    return {
      debt: active.find((d) => d.id === pick.id) ?? null,
      byDueDate: true,
    };
  }

  const flexible = active.filter((d) => {
    const meta = scheduleById.get(d.id);
    return !meta || !isScheduledDebt(meta);
  });

  const pool = flexible.length > 0 ? flexible : active;
  return {
    debt: sortDebtsByStrategy(pool, strategy, exchangeRate)[0] ?? null,
    byDueDate: false,
  };
}

export function buildScheduleFields(
  paymentPriority: DebtPaymentPriority,
  nextPaymentDate?: string
): Pick<Debt, "paymentPriority" | "nextPaymentDate" | "dayOfMonth"> {
  if (paymentPriority !== "scheduled" || !nextPaymentDate) {
    return { paymentPriority: "flexible" };
  }
  const dayOfMonth = dayOfMonthFromDateKey(nextPaymentDate);
  return {
    paymentPriority: "scheduled",
    nextPaymentDate,
    dayOfMonth,
  };
}

export function sanitizeDebtSchedule(debt: Partial<Debt>): Pick<
  Debt,
  "paymentPriority" | "nextPaymentDate" | "dayOfMonth" | "lastPaidMonthKey"
> {
  const paymentPriority =
    debt.paymentPriority === "scheduled" ? "scheduled" : "flexible";

  if (paymentPriority !== "scheduled") {
    return { paymentPriority: "flexible" };
  }

  const dayOfMonth = Math.min(
    31,
    Math.max(1, Math.round(debt.dayOfMonth ?? 1))
  );
  const nextPaymentDate =
    typeof debt.nextPaymentDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(debt.nextPaymentDate)
      ? debt.nextPaymentDate
      : computeNextPaymentDateFromDay(dayOfMonth);

  return {
    paymentPriority: "scheduled",
    nextPaymentDate,
    dayOfMonth: dayOfMonthFromDateKey(nextPaymentDate),
    lastPaidMonthKey:
      typeof debt.lastPaidMonthKey === "string"
        ? debt.lastPaidMonthKey
        : undefined,
  };
}

export function advanceDebtPaymentDate(debt: SchedulableDebt): string | undefined {
  if (!isScheduledDebt(debt) || !debt.nextPaymentDate) return undefined;
  const day = debt.dayOfMonth ?? dayOfMonthFromDateKey(debt.nextPaymentDate);
  return advancePaymentDate(debt.nextPaymentDate, day);
}

export function isDebtMinimumPaidThisMonth(
  debt: SchedulableDebt,
  now: Date = new Date()
): boolean {
  if (!isScheduledDebt(debt)) return false;
  return debt.lastPaidMonthKey === getMonthKey(now);
}

export function canMarkDebtMinimumPaid(
  debt: SchedulableDebt,
  now: Date = new Date()
): boolean {
  return isScheduledDebt(debt) && !isDebtMinimumPaidThisMonth(debt, now);
}

/** true si el mínimo no se actualizó para el mes en curso. */
export function needsMinimumUpdate(
  debt: SchedulableDebt,
  now: Date = new Date()
): boolean {
  if (!isScheduledDebt(debt)) return false;
  const monthKey = getMonthKey(now);
  if (debt.lastPaidMonthKey === monthKey) return false;
  return debt.minimumPaymentMonthKey !== monthKey;
}

/** Registra el mínimo mensual pagado y avanza el ciclo. */
export function getDebtMinimumPaidUpdate(
  debt: Debt,
  now: Date = new Date()
): Pick<Debt, "balance" | "lastPaidMonthKey" | "nextPaymentDate" | "lastNotifiedKey"> | null {
  if (!canMarkDebtMinimumPaid(debt, now)) return null;

  const newBalance = Math.max(
    0,
    Math.round((debt.balance - debt.minimumPayment) * 100) / 100
  );
  const nextPaymentDate = advanceDebtPaymentDate(debt);

  return {
    balance: newBalance,
    lastPaidMonthKey: getMonthKey(now),
    nextPaymentDate: nextPaymentDate ?? debt.nextPaymentDate,
    lastNotifiedKey: undefined,
  };
}

export function shouldAdvanceDebtCycle(
  debt: SchedulableDebt,
  allocatedMinimumDOP: number,
  exchangeRate: number,
  now: Date = new Date()
): boolean {
  if (!isScheduledDebt(debt)) return false;
  const monthKey = getMonthKey(now);
  if (debt.lastPaidMonthKey === monthKey) return false;

  const minimumDOP =
    debt.currency === "USD"
      ? debt.minimumPayment * exchangeRate
      : debt.minimumPayment;

  return allocatedMinimumDOP >= minimumDOP * 0.9;
}

export type DebtReminderKind = "due_today" | "due_soon";

export interface DebtReminder {
  debt: SchedulableDebt;
  kind: DebtReminderKind;
  notifyKey: string;
}

/** Deudas con fecha vencida o próxima (≤7 días) que aún no cubrieron el mínimo del mes. */
export function getUrgentDebtCommitments(
  debts: Array<{
    id: string;
    name: string;
    currency: Debt["currency"];
    balance: number;
    minimumPayment: number;
    interestRate: number;
  }>,
  scheduleById: Map<string, SchedulableDebt>,
  exchangeRate: number,
  now: Date = new Date(),
  urgentWithinDays = 7
): Array<{
  id: string;
  name: string;
  currency: Debt["currency"];
  balance: number;
  minimumPayment: number;
  interestRate: number;
  monthlyMinimumDOP: number;
}> {
  const urgent = sortScheduledDebtsByUrgency(
    debts
      .map((d) => scheduleById.get(d.id))
      .filter((d): d is SchedulableDebt => !!d && isScheduledDebt(d)),
    now
  ).filter((meta) => {
    const status = getDebtDueStatus(meta, now);
    if (status === "paid") return false;
    const days = daysUntilDebtDue(meta, now) ?? 99;
    return status === "due" || days <= urgentWithinDays;
  });

  return urgent.map((meta) => {
    const input = debts.find((d) => d.id === meta.id)!;
    return {
      id: input.id,
      name: input.name,
      currency: input.currency,
      balance: input.balance,
      minimumPayment: input.minimumPayment,
      interestRate: input.interestRate,
      monthlyMinimumDOP: toDOP(input.minimumPayment, input.currency, exchangeRate),
    };
  });
}

export function getDebtRemindersForToday(
  debts: SchedulableDebt[],
  globalEnabled: boolean,
  now: Date = new Date()
): DebtReminder[] {
  if (!globalEnabled) return [];

  const todayKey = toDateKey(startOfDay(now));
  const results: DebtReminder[] = [];

  for (const debt of debts) {
    if (!isScheduledDebt(debt)) continue;
    if (getDebtDueStatus(debt, now) === "paid") continue;
    if (debt.lastNotifiedKey === todayKey) continue;

    const daysLeft = daysUntilDebtDue(debt, now);
    if (daysLeft === null) continue;

    if (daysLeft === 0) {
      results.push({ debt, kind: "due_today", notifyKey: todayKey });
    } else if (daysLeft === 3 || daysLeft === 1) {
      results.push({ debt, kind: "due_soon", notifyKey: todayKey });
    }
  }

  return results;
}
