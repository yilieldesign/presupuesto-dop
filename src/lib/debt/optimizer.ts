import { mergeUrgentCommitments } from "@/lib/budget/urgentCommitments";
import { fromDOP, toDOP } from "@/lib/currency/convert";
import type { Currency, DebtStrategy, ExpenseCategory, FixedExpense } from "@/types";
import {
  getExtraInjectionPriority,
  type SchedulableDebt,
} from "./debtSchedule";
import { isDebtActive } from "./strategies";
import type { DebtInput } from "./types";
import { BALANCE_EPSILON, roundMoney } from "./utils";

export type AllocationType =
  | "commitment_payment"
  | "fixed_expense_payment"
  | "extra_injection";

export type AllocationTarget = "debt" | "fixed_expense";

/** @deprecated Usar commitment_payment — compatibilidad con inyecciones guardadas. */
export function isCommitmentAllocationType(type: string): boolean {
  return type === "commitment_payment" || type === "weekly_minimum";
}

export function isFixedExpenseAllocation(
  allocation: CashAllocation
): boolean {
  return (
    allocation.target === "fixed_expense" ||
    allocation.type === "fixed_expense_payment"
  );
}

export interface CashAllocation {
  target: AllocationTarget;
  debtId: string;
  debtName: string;
  currency: Currency;
  type: AllocationType;
  /** Monto en la moneda nativa (RD$ para gastos fijos). */
  amount: number;
  /** Equivalente en RD$ descontado del cobro del día. */
  amountDOP: number;
  /** Monto completo del compromiso en moneda nativa. */
  commitmentAmountDue: number;
  balanceBefore: number;
  balanceAfter: number;
  category?: ExpenseCategory;
  /** Gasto fijo cubierto por completo (avance de ciclo). */
  paidInFull?: boolean;
}

export interface OptimizeCashOptions {
  cashAmount: number;
  debts: DebtInput[];
  fixedExpenses?: FixedExpense[];
  strategy: DebtStrategy;
  exchangeRate: number;
  weeklyFixedFund?: number;
  weekFundSpent?: number;
  /** Metadatos de fecha de pago por id de deuda. */
  debtSchedule?: SchedulableDebt[];
  now?: Date;
  urgentWithinDays?: number;
}

export interface OptimizationResult {
  cashAmount: number;
  strategy: DebtStrategy;
  exchangeRate: number;
  vitalFundNeeded: number;
  vitalFundReserved: number;
  insufficientForVitalFund: boolean;
  /** Suma de compromisos urgentes (deudas + gastos fijos) en RD$. */
  totalCommitmentsRequired: number;
  totalAllocatedToCommitments: number;
  totalAllocatedToFixedExpenses: number;
  totalExtraInjection: number;
  /** Total descontado del cobro hacia deudas (RD$). */
  totalAllocatedToDebts: number;
  /** Total hacia obligaciones (deudas + gastos fijos). */
  totalAllocated: number;
  totalAssigned: number;
  unallocated: number;
  insufficientForCommitments: boolean;
  priorityDebtId: string | null;
  priorityDebtName: string | null;
  /** true si la prioridad fue por fecha de pago, no por estrategia. */
  priorityByDueDate: boolean;
  allocations: CashAllocation[];
}

interface WorkingDebt extends DebtInput {
  monthlyMinimumDOP: number;
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
    totalCommitmentsRequired: 0,
    totalAllocatedToCommitments: 0,
    totalAllocatedToFixedExpenses: 0,
    totalExtraInjection: 0,
    totalAllocatedToDebts: 0,
    totalAllocated: 0,
    totalAssigned: 0,
    unallocated: roundMoney(Math.max(0, cashAmount)),
    insufficientForCommitments: false,
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

function payFixedExpenseFromPool(
  remainingDOP: number,
  amountDue: number
): { paymentDOP: number; newRemainingDOP: number; paidInFull: boolean } {
  const paymentDOP = roundMoney(Math.min(remainingDOP, amountDue));
  return {
    paymentDOP,
    newRemainingDOP: roundMoney(remainingDOP - paymentDOP),
    paidInFull: paymentDOP >= amountDue,
  };
}

function pushDebtAllocation(
  allocations: CashAllocation[],
  debt: WorkingDebt,
  type: AllocationType,
  paymentNative: number,
  paymentDOP: number,
  balanceBefore: number,
  balanceAfter: number
) {
  allocations.push({
    target: "debt",
    debtId: debt.id,
    debtName: debt.name,
    currency: debt.currency,
    type,
    amount: paymentNative,
    amountDOP: paymentDOP,
    commitmentAmountDue: debt.minimumPayment,
    balanceBefore,
    balanceAfter,
  });
}

function sumAllocationDOP(
  allocations: CashAllocation[],
  predicate: (a: CashAllocation) => boolean
): number {
  return roundMoney(
    allocations.filter(predicate).reduce((sum, a) => sum + a.amountDOP, 0)
  );
}

/**
 * Optimizador de cobros (RD$):
 * 0. Fondo vital semanal
 * 1. Compromisos urgentes — gastos fijos y mínimos de deuda (vencidos o ≤7 días)
 * 2. Excedente a la deuda prioritaria (fecha o estrategia bola de nieve/avalancha)
 */
export function optimizeCashInjection(
  options: OptimizeCashOptions
): OptimizationResult {
  const {
    cashAmount,
    debts,
    fixedExpenses = [],
    strategy,
    exchangeRate,
    weeklyFixedFund = 0,
    weekFundSpent = 0,
    debtSchedule = [],
    now = new Date(),
    urgentWithinDays = 7,
  } = options;

  const scheduleById = new Map(debtSchedule.map((d) => [d.id, d]));

  if (cashAmount <= 0) return buildEmptyResult(cashAmount, strategy, exchangeRate);

  const workingDebts: WorkingDebt[] = debts
    .filter((d) => d.balance > BALANCE_EPSILON)
    .map((d) => ({
      ...d,
      monthlyMinimumDOP: toDOP(d.minimumPayment, d.currency, exchangeRate),
    }));

  let remaining = roundMoney(cashAmount);

  const vitalFundNeeded = roundMoney(
    Math.max(0, weeklyFixedFund - weekFundSpent)
  );
  const vitalFundReserved = roundMoney(Math.min(vitalFundNeeded, remaining));
  remaining = roundMoney(remaining - vitalFundReserved);
  const insufficientForVitalFund =
    vitalFundNeeded > 0 && vitalFundReserved < vitalFundNeeded;

  const urgentCommitments = mergeUrgentCommitments(
    fixedExpenses,
    workingDebts,
    scheduleById,
    exchangeRate,
    now,
    urgentWithinDays
  );

  const totalCommitmentsRequired = roundMoney(
    urgentCommitments.reduce((sum, c) => sum + c.amountDOP, 0)
  );

  const allocations: CashAllocation[] = [];
  const balances = new Map(workingDebts.map((d) => [d.id, d.balance]));
  const cashForCommitments = remaining;
  const insufficientForCommitments =
    urgentCommitments.length > 0 && cashForCommitments < totalCommitmentsRequired;

  for (const commitment of urgentCommitments) {
    if (remaining <= 0) break;

    if (commitment.source === "fixed_expense" && commitment.fixedExpense) {
      const expense = commitment.fixedExpense;
      const payment = payFixedExpenseFromPool(remaining, expense.amount);

      if (payment.paymentDOP <= 0) continue;

      remaining = payment.newRemainingDOP;

      allocations.push({
        target: "fixed_expense",
        debtId: expense.id,
        debtName: expense.name,
        currency: "DOP",
        type: "fixed_expense_payment",
        amount: payment.paymentDOP,
        amountDOP: payment.paymentDOP,
        commitmentAmountDue: expense.amount,
        balanceBefore: 0,
        balanceAfter: 0,
        category: expense.category,
        paidInFull: payment.paidInFull,
      });
      continue;
    }

    const debt = workingDebts.find((d) => d.id === commitment.id);
    if (!debt) continue;

    const balanceBefore = balances.get(debt.id)!;
    const payment = payFromDOPPool(
      remaining,
      balanceBefore,
      debt.currency,
      commitment.amountDOP,
      exchangeRate
    );

    if (payment.paymentDOP <= 0) continue;

    balances.set(debt.id, payment.newBalanceNative);
    remaining = payment.newRemainingDOP;

    pushDebtAllocation(
      allocations,
      debt,
      "commitment_payment",
      payment.paymentNative,
      payment.paymentDOP,
      balanceBefore,
      payment.newBalanceNative
    );
  }

  const totalAllocatedToCommitments = sumAllocationDOP(allocations, (a) =>
    isCommitmentAllocationType(a.type)
  );
  const totalAllocatedToFixedExpenses = sumAllocationDOP(allocations, (a) =>
    isFixedExpenseAllocation(a)
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
    getExtraInjectionPriority(
      simDebts,
      strategy,
      exchangeRate,
      scheduleById,
      now,
      urgentWithinDays
    );

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

      pushDebtAllocation(
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

  const totalAllocatedToDebts = roundMoney(
    totalAllocatedToCommitments + totalExtraInjection
  );
  const totalAllocated = roundMoney(
    totalAllocatedToDebts + totalAllocatedToFixedExpenses
  );

  return {
    cashAmount: roundMoney(cashAmount),
    strategy,
    exchangeRate,
    vitalFundNeeded,
    vitalFundReserved,
    insufficientForVitalFund,
    totalCommitmentsRequired,
    totalAllocatedToCommitments,
    totalAllocatedToFixedExpenses,
    totalExtraInjection,
    totalAllocatedToDebts,
    totalAllocated,
    totalAssigned: roundMoney(vitalFundReserved + totalAllocated),
    unallocated: roundMoney(Math.max(0, remaining)),
    insufficientForCommitments,
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
    if (isFixedExpenseAllocation(allocation)) continue;
    balanceMap.set(allocation.debtId, allocation.balanceAfter);
  }

  return debts.map((debt) => {
    const newBalance = balanceMap.get(debt.id);
    if (newBalance === undefined) return debt;
    return { ...debt, balance: Math.max(0, newBalance) };
  });
}

export const VITAL_FUND_LINE_KEY = "vital_fund";

export function getAllocationLineKey(allocation: CashAllocation): string {
  if (isFixedExpenseAllocation(allocation)) {
    return `fixed:${allocation.debtId}:fixed_expense_payment`;
  }
  return `debt:${allocation.debtId}:${allocation.type}`;
}

function getOriginalBalances(
  allocations: CashAllocation[]
): Map<string, number> {
  const balances = new Map<string, number>();
  for (const allocation of allocations) {
    if (isFixedExpenseAllocation(allocation)) continue;
    if (!balances.has(allocation.debtId)) {
      balances.set(allocation.debtId, allocation.balanceBefore);
    }
  }
  return balances;
}

/**
 * Aplica exclusiones del usuario y recalcula saldos/totales del plan.
 * El cobro original (cashAmount) no cambia; lo no asignado queda en unallocated.
 */
export function adjustOptimizationResult(
  result: OptimizationResult,
  excludedLines: ReadonlySet<string>
): OptimizationResult {
  const vitalFundReserved = excludedLines.has(VITAL_FUND_LINE_KEY)
    ? 0
    : result.vitalFundReserved;

  const originalBalances = getOriginalBalances(result.allocations);
  const workingBalances = new Map(originalBalances);
  const allocations: CashAllocation[] = [];

  for (const allocation of result.allocations) {
    if (excludedLines.has(getAllocationLineKey(allocation))) continue;

    if (isFixedExpenseAllocation(allocation)) {
      allocations.push({ ...allocation });
      continue;
    }

    const balanceBefore =
      workingBalances.get(allocation.debtId) ?? allocation.balanceBefore;
    const balanceAfter = roundMoney(
      Math.max(0, balanceBefore - allocation.amount)
    );
    workingBalances.set(allocation.debtId, balanceAfter);

    allocations.push({
      ...allocation,
      target: allocation.target ?? "debt",
      balanceBefore,
      balanceAfter,
    });
  }

  const totalAllocatedToCommitments = sumAllocationDOP(allocations, (a) =>
    isCommitmentAllocationType(a.type)
  );
  const totalAllocatedToFixedExpenses = sumAllocationDOP(allocations, (a) =>
    isFixedExpenseAllocation(a)
  );
  const totalExtraInjection = sumAllocationDOP(
    allocations,
    (a) => a.type === "extra_injection"
  );
  const totalAllocatedToDebts = roundMoney(
    totalAllocatedToCommitments + totalExtraInjection
  );
  const totalAllocated = roundMoney(
    totalAllocatedToDebts + totalAllocatedToFixedExpenses
  );
  const totalAssigned = roundMoney(vitalFundReserved + totalAllocated);
  const unallocated = roundMoney(Math.max(0, result.cashAmount - totalAssigned));

  const extra = allocations.find((a) => a.type === "extra_injection");

  return {
    ...result,
    vitalFundReserved,
    allocations,
    totalAllocatedToCommitments,
    totalAllocatedToFixedExpenses,
    totalExtraInjection,
    totalAllocatedToDebts,
    totalAllocated,
    totalAssigned,
    unallocated,
    priorityDebtId: extra?.debtId ?? null,
    priorityDebtName: extra?.debtName ?? null,
    priorityByDueDate: extra ? result.priorityByDueDate : false,
    insufficientForVitalFund:
      result.vitalFundNeeded > 0 &&
      vitalFundReserved < result.vitalFundNeeded &&
      !excludedLines.has(VITAL_FUND_LINE_KEY),
  };
}
