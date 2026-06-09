import {
  DEFAULT_APP_STATE,
  type AppState,
  type CashInjection,
  type Debt,
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
    onboardingDone: parsed.onboardingDone === true,
  };
}
