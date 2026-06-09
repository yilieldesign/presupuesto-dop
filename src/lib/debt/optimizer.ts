import { fromDOP, toDOP } from "@/lib/currency/convert";
import type { Currency, DebtStrategy } from "@/types";
import {
  getExtraInjectionPriority,
  type SchedulableDebt,
} from "./debtSchedule";
import { isDebtActive } from "./strategies";
import type { DebtInput } from "./types";
import { BALANCE_EPSILON, roundMoney, WEEKS_PER_MONTH } from "./utils";

export type AllocationType = "weekly_minimum" | "extra_injection";

export interface CashAllocation {
  debtId: string;
  debtName: string;
  currency: Currency;
  type: AllocationType;
  /** Monto en la moneda nativa de la deuda. */
  amount: number;
  /** Equivalente en RD$ descontado del cobro del día. */
  amountDOP: number;
  weeklyMinimumDue: number;
  balanceBefore: number;
  balanceAfter: number;
}

export interface OptimizeCashOptions {
  cashAmount: number;
  debts: DebtInput[];
  strategy: DebtStrategy;
  exchangeRate: number;
  weeksPerMonth?: number;
  weeklyFixedFund?: number;
  weekFundSpent?: number;
  /** Metadatos de fecha de pago por id de deuda. */
  debtSchedule?: SchedulableDebt[];
}

export interface OptimizationResult {
  cashAmount: number;
  strategy: DebtStrategy;
  exchangeRate: number;
  vitalFundNeeded: number;
  vitalFundReserved: number;
  insufficientForVitalFund: boolean;
  /** Suma de mínimos semanales en RD$. */
  totalWeeklyMinimumsRequired: number;
  totalAllocatedToMinimums: number;
  totalExtraInjection: number;
  /** Total descontado del cobro hacia deudas (RD$). */
  totalAllocated: number;
  totalAssigned: number;
  unallocated: number;
  insufficientForMinimums: boolean;
  priorityDebtId: string | null;
  priorityDebtName: string | null;
  /** true si la prioridad fue por fecha de pago, no por estrategia. */
  priorityByDueDate: boolean;
  allocations: CashAllocation[];
}

interface WorkingDebt extends DebtInput {
  weeklyMinimum: number;
  weeklyMinimumDOP: number;
}

function getWeeklyMinimum(monthlyMinimum: number, weeksPerMonth: number): number {
  return roundMoney(monthlyMinimum / weeksPerMonth);
}

function buildEmptyResult(
  cashAmount: number,
  strategy: DebtStrategy,
  exchangeRate: number
): OptimizationResult {
  return {
    cashAmount: roundMoney(cashAmount),
    strategy,
    exchangeRate,
    vitalFundNeeded: 0,
    vitalFundReserved: 0,
    insufficientForVitalFund: false,
    totalWeeklyMinimumsRequired: 0,
    totalAllocatedToMinimums: 0,
    totalExtraInjection: 0,
    totalAllocated: 0,
    totalAssigned: 0,
    unallocated: roundMoney(Math.max(0, cashAmount)),
    insufficientForMinimums: false,
    priorityDebtId: null,
    priorityDebtName: null,
    priorityByDueDate: false,
    allocations: [],
  };
}

function payFromDOPPool(
  remainingDOP: number,
  balanceNative: number,
  currency: Currency,
  targetDOP: number,
  exchangeRate: number
): {
  paymentDOP: number;
  paymentNative: number;
  newBalanceNative: number;
  newRemainingDOP: number;
} {
  if (remainingDOP <= 0 || balanceNative <= BALANCE_EPSILON) {
    return {
      paymentDOP: 0,
      paymentNative: 0,
      newBalanceNative: balanceNative,
      newRemainingDOP: remainingDOP,
    };
  }

  const balanceDOP = toDOP(balanceNative, currency, exchangeRate);
  const paymentDOP = roundMoney(
    Math.min(remainingDOP, targetDOP, balanceDOP)
  );
  let paymentNative = fromDOP(paymentDOP, currency, exchangeRate);
  paymentNative = roundMoney(Math.min(paymentNative, balanceNative));

  const actualDOP = toDOP(paymentNative, currency, exchangeRate);
  const newBalanceNative = roundMoney(balanceNative - paymentNative);

  return {
    paymentDOP: actualDOP,
    paymentNative,
    newBalanceNative,
    newRemainingDOP: roundMoney(remainingDOP - actualDOP),
  };
}

function pushAllocation(
  allocations: CashAllocation[],
  debt: WorkingDebt,
  type: AllocationType,
  paymentNative: number,
  paymentDOP: number,
  balanceBefore: number,
  balanceAfter: number
) {
  allocations.push({
    debtId: debt.id,
    debtName: debt.name,
    currency: debt.currency,
    type,
    amount: paymentNative,
    amountDOP: paymentDOP,
    weeklyMinimumDue: debt.weeklyMinimum,
    balanceBefore,
    balanceAfter,
  });
}

/**
 * Optimizador de Menudeo (cobro siempre en RD$):
 * 0. Fondo vital semanal
 * 1. Mínimos semanales (deudas en RD$ y US$ convertidas a tasa del día)
 * 2. Excedente a deuda prioritaria
 */
export function optimizeCashInjection(
  options: OptimizeCashOptions
): OptimizationResult {
  const {
    cashAmount,
    debts,
    strategy,
    exchangeRate,
    weeksPerMonth = WEEKS_PER_MONTH,
    weeklyFixedFund = 0,
    weekFundSpent = 0,
    debtSchedule = [],
  } = options;

  const scheduleById = new Map(debtSchedule.map((d) => [d.id, d]));

  if (cashAmount <= 0) return buildEmptyResult(cashAmount, strategy, exchangeRate);

  const workingDebts: WorkingDebt[] = debts
    .filter((d) => d.balance > BALANCE_EPSILON)
    .map((d) => {
      const weeklyMinimum = getWeeklyMinimum(d.minimumPayment, weeksPerMonth);
      return {
        ...d,
        weeklyMinimum,
        weeklyMinimumDOP: toDOP(weeklyMinimum, d.currency, exchangeRate),
      };
    });

  let remaining = roundMoney(cashAmount);

  const vitalFundNeeded = roundMoney(
    Math.max(0, weeklyFixedFund - weekFundSpent)
  );
  const vitalFundReserved = roundMoney(Math.min(vitalFundNeeded, remaining));
  remaining = roundMoney(remaining - vitalFundReserved);
  const insufficientForVitalFund =
    vitalFundNeeded > 0 && vitalFundReserved < vitalFundNeeded;

  if (workingDebts.length === 0) {
    return {
      ...buildEmptyResult(cashAmount, strategy, exchangeRate),
      vitalFundNeeded,
      vitalFundReserved,
      insufficientForVitalFund,
      totalAssigned: vitalFundReserved,
      unallocated: remaining,
    };
  }

  const totalWeeklyMinimumsRequired = roundMoney(
    workingDebts.reduce((sum, d) => sum + d.weeklyMinimumDOP, 0)
  );

  const allocations: CashAllocation[] = [];
  const balances = new Map(workingDebts.map((d) => [d.id, d.balance]));
  const cashForDebts = remaining;
  const insufficientForMinimums = cashForDebts < totalWeeklyMinimumsRequired;

  if (insufficientForMinimums && cashForDebts > 0) {
    for (const debt of workingDebts) {
      if (remaining <= 0) break;

      const share = debt.weeklyMinimumDOP / totalWeeklyMinimumsRequired;
      const targetDOP = roundMoney(cashForDebts * share);
      const balanceBefore = balances.get(debt.id)!;

      const payment = payFromDOPPool(
        remaining,
        balanceBefore,
        debt.currency,
        targetDOP,
        exchangeRate
      );

      if (payment.paymentDOP <= 0) continue;

      balances.set(debt.id, payment.newBalanceNative);
      remaining = payment.newRemainingDOP;

      pushAllocation(
        allocations,
        debt,
        "weekly_minimum",
        payment.paymentNative,
        payment.paymentDOP,
        balanceBefore,
        payment.newBalanceNative
      );
    }
  } else {
    for (const debt of workingDebts) {
      const balanceBefore = balances.get(debt.id)!;

      const payment = payFromDOPPool(
        remaining,
        balanceBefore,
        debt.currency,
        debt.weeklyMinimumDOP,
        exchangeRate
      );

      if (payment.paymentDOP <= 0) continue;

      balances.set(debt.id, payment.newBalanceNative);
      remaining = payment.newRemainingDOP;

      pushAllocation(
        allocations,
        debt,
        "weekly_minimum",
        payment.paymentNative,
        payment.paymentDOP,
        balanceBefore,
        payment.newBalanceNative
      );
    }
  }

  const totalAllocatedToMinimums = roundMoney(
    allocations
      .filter((a) => a.type === "weekly_minimum")
      .reduce((sum, a) => sum + a.amountDOP, 0)
  );

  const simDebts = workingDebts.map((d) => ({
    id: d.id,
    name: d.name,
    currency: d.currency,
    balance: balances.get(d.id)!,
    interestRate: d.interestRate,
    minimumPayment: d.minimumPayment,
  }));

  const { debt: priority, byDueDate: priorityByDueDate } =
    getExtraInjectionPriority(simDebts, strategy, exchangeRate, scheduleById);

  let totalExtraInjection = 0;

  if (priority && remaining > 0 && isDebtActive(priority)) {
    const debt = workingDebts.find((d) => d.id === priority.id)!;
    const balanceBefore = balances.get(priority.id)!;
    const balanceDOP = toDOP(balanceBefore, priority.currency, exchangeRate);

    const payment = payFromDOPPool(
      remaining,
      balanceBefore,
      priority.currency,
      balanceDOP,
      exchangeRate
    );

    if (payment.paymentDOP > 0) {
      balances.set(priority.id, payment.newBalanceNative);
      remaining = payment.newRemainingDOP;
      totalExtraInjection = payment.paymentDOP;

      pushAllocation(
        allocations,
        debt,
        "extra_injection",
        payment.paymentNative,
        payment.paymentDOP,
        balanceBefore,
        payment.newBalanceNative
      );
    }
  }

  const totalAllocated = roundMoney(
    allocations.reduce((sum, a) => sum + a.amountDOP, 0)
  );

  return {
    cashAmount: roundMoney(cashAmount),
    strategy,
    exchangeRate,
    vitalFundNeeded,
    vitalFundReserved,
    insufficientForVitalFund,
    totalWeeklyMinimumsRequired,
    totalAllocatedToMinimums,
    totalExtraInjection,
    totalAllocated,
    totalAssigned: roundMoney(vitalFundReserved + totalAllocated),
    unallocated: roundMoney(Math.max(0, remaining)),
    insufficientForMinimums,
    priorityDebtId: priority?.id ?? null,
    priorityDebtName: priority?.name ?? null,
    priorityByDueDate,
    allocations,
  };
}

export function applyCashOptimization(
  debts: DebtInput[],
  allocations: CashAllocation[]
): DebtInput[] {
  const balanceMap = new Map<string, number>();

  for (const allocation of allocations) {
    balanceMap.set(allocation.debtId, allocation.balanceAfter);
  }

  return debts.map((debt) => {
    const newBalance = balanceMap.get(debt.id);
    if (newBalance === undefined) return debt;
    return { ...debt, balance: Math.max(0, newBalance) };
  });
}
