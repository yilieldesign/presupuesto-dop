import {
  computeNextPaymentDateFromDay,
  dayOfMonthFromDateKey,
} from "@/lib/budget/fixedExpenses";
import { normalizeUserName } from "@/lib/user/displayName";
import {
  DEFAULT_APP_STATE,
  type AppState,
  type CashInjection,
  type Debt,
  type FixedExpense,
  type InjectionAllocation,
  type SavingsGoal,
  type WeeklyFundItem,
} from "@/types";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function sanitizeDebts(debts: unknown): Debt[] {
  return asArray<Debt>(debts)
    .filter((d) => d && typeof d.name === "string" && d.balance >= 0)
    .map((d) => ({
      ...d,
      currency: d.currency === "USD" ? "USD" : "DOP",
      originalBalance: d.originalBalance ?? d.balance ?? 0,
    }));
}

function sanitizeWeeklyFund(items: unknown): WeeklyFundItem[] {
  return asArray<WeeklyFundItem>(items).filter(
    (i) => i && typeof i.category === "string" && i.amount > 0
  );
}

function sanitizeSavingsGoals(goals: unknown): SavingsGoal[] {
  return asArray<SavingsGoal>(goals)
    .filter((g) => g && typeof g.name === "string" && g.targetAmount > 0)
    .map((g) => ({ ...g, balance: Math.max(0, g.balance ?? 0) }));
}

function sanitizeFixedExpenses(expenses: unknown): FixedExpense[] {
  return asArray<FixedExpense>(expenses)
    .filter(
      (e) =>
        e &&
        typeof e.name === "string" &&
        e.amount > 0 &&
        (typeof e.dayOfMonth === "number" || typeof e.nextPaymentDate === "string")
    )
    .map((e) => {
      const dayOfMonth = Math.min(
        31,
        Math.max(
          1,
          Math.round(
            e.dayOfMonth ??
              (e.nextPaymentDate
                ? dayOfMonthFromDateKey(e.nextPaymentDate)
                : 1)
          )
        )
      );
      const nextPaymentDate =
        typeof e.nextPaymentDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(e.nextPaymentDate)
          ? e.nextPaymentDate
          : computeNextPaymentDateFromDay(dayOfMonth);

      const reminderDaysBefore = [0, 1, 3, 7].includes(
        e.reminderDaysBefore as number
      )
        ? (e.reminderDaysBefore as number)
        : 1;

      return {
        ...e,
        dayOfMonth,
        nextPaymentDate,
        reminderEnabled: e.reminderEnabled !== false,
        reminderDaysBefore,
        lastPaidMonthKey:
          typeof e.lastPaidMonthKey === "string" ? e.lastPaidMonthKey : undefined,
        lastNotifiedKey:
          typeof e.lastNotifiedKey === "string" ? e.lastNotifiedKey : undefined,
      };
    });
}

/** Carga solo campos válidos — nunca mezcla basura de versiones anteriores. */
export function sanitizeAppState(raw: unknown): AppState {
  const parsed =
    raw && typeof raw === "object" ? (raw as Partial<AppState>) : {};

  const legacyFund = (parsed as { weeklyFixedFund?: number }).weeklyFixedFund;
  let weeklyFundItems = sanitizeWeeklyFund(parsed.weeklyFundItems);

  if (weeklyFundItems.length === 0 && legacyFund && legacyFund > 0) {
    weeklyFundItems = [
      { id: "legacy-comida", category: "comida", amount: legacyFund },
    ];
  }

  const legacySpent = (parsed as { weekFundSpent?: number }).weekFundSpent;
  const weekFundCategorySpent =
    parsed.weekFundCategorySpent ??
    (legacySpent ? { comida: legacySpent } : {});

  return {
    debts: sanitizeDebts(parsed.debts),
    transactions: asArray(parsed.transactions),
    injections: asArray<CashInjection>(parsed.injections).map((inj) => ({
      ...inj,
      vitalFundReserved: inj.vitalFundReserved ?? 0,
      allocations: asArray<InjectionAllocation>(inj.allocations).map((a) => ({
        ...a,
        currency: a.currency === "USD" ? "USD" : "DOP",
        amountDOP: a.amountDOP ?? a.amount ?? 0,
      })),
    })),
    extraAcceleration: 0,
    debtStrategy:
      parsed.debtStrategy === "avalanche" ? "avalanche" : "snowball",
    exchangeRate:
      typeof parsed.exchangeRate === "number" && parsed.exchangeRate > 0
        ? parsed.exchangeRate
        : DEFAULT_APP_STATE.exchangeRate,
    exchangeRateUpdatedAt: parsed.exchangeRateUpdatedAt ?? null,
    exchangeRateAuto: parsed.exchangeRateAuto !== false,
    weeklyFundItems,
    weekFundCategorySpent,
    weekFundWeekKey: parsed.weekFundWeekKey ?? "",
    savingsGoals: sanitizeSavingsGoals(parsed.savingsGoals),
    savingsDeposits: asArray(parsed.savingsDeposits),
    fixedExpenses: sanitizeFixedExpenses(parsed.fixedExpenses),
    fixedExpenseNotificationsEnabled:
      parsed.fixedExpenseNotificationsEnabled !== false,
    userName:
      typeof parsed.userName === "string"
        ? normalizeUserName(parsed.userName)
        : "",
    onboardingDone: parsed.onboardingDone === true,
  };
}
