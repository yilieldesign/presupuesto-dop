import { DEFAULT_EXCHANGE_RATE } from "@/lib/currency/convert";
import {
  annualToMonthlyRate,
  isDebtActive,
  sortDebtsByStrategy,
} from "./strategies";
import type {
  DebtInput,
  DebtPaymentDetail,
  MonthlyScheduleEntry,
  SimDebt,
  SimulationOptions,
  SimulationResult,
} from "./types";
import { BALANCE_EPSILON, roundMoney } from "./utils";

const DEFAULT_MAX_MONTHS = 600;

function cloneDebts(debts: DebtInput[]): SimDebt[] {
  return debts.map((debt) => ({ ...debt }));
}

function totalBalance(debts: SimDebt[]): number {
  return debts.reduce((sum, debt) => sum + Math.max(0, debt.balance), 0);
}

/**
 * Simula un mes de pagos con la estrategia indicada.
 *
 * Flujo:
 * 1. Se capitaliza interés mensual sobre cada deuda activa.
 * 2. Se pagan los mínimos en todas las deudas activas.
 * 3. El extra de aceleración (más mínimos liberados) se aplica en cascada
 *    a la deuda prioritaria según Bola de Nieve o Avalancha.
 */
function simulateMonth(
  debts: SimDebt[],
  strategy: SimulationOptions["strategy"],
  extraAcceleration: number,
  exchangeRate: number
): MonthlyScheduleEntry {
  const ordered = sortDebtsByStrategy(debts, strategy, exchangeRate);
  const focus = ordered[0];

  const payments: DebtPaymentDetail[] = debts.map((debt) => ({
    debtId: debt.id,
    debtName: debt.name,
    interestCharged: 0,
    minimumPaid: 0,
    extraPaid: 0,
    totalPaid: 0,
    balanceAfter: debt.balance,
  }));

  const paymentMap = new Map(payments.map((p) => [p.debtId, p]));

  // 1. Capitalizar interés
  for (const debt of debts) {
    if (!isDebtActive(debt)) continue;

    const monthlyRate = annualToMonthlyRate(debt.interestRate);
    const interest = roundMoney(debt.balance * monthlyRate);
    debt.balance = roundMoney(debt.balance + interest);

    const detail = paymentMap.get(debt.id)!;
    detail.interestCharged = interest;
    detail.balanceAfter = debt.balance;
  }

  // 2. Pagar mínimos
  for (const debt of debts) {
    if (!isDebtActive(debt)) continue;

    const payment = roundMoney(Math.min(debt.balance, debt.minimumPayment));
    debt.balance = roundMoney(debt.balance - payment);

    const detail = paymentMap.get(debt.id)!;
    detail.minimumPaid = payment;
    detail.totalPaid = roundMoney(detail.totalPaid + payment);
    detail.balanceAfter = debt.balance;
  }

  // 3. Aplicar extra en cascada según prioridad
  let extraPool = roundMoney(extraAcceleration);

  for (const debt of ordered) {
    if (!isDebtActive(debt)) {
      extraPool = roundMoney(extraPool + debt.minimumPayment);
      continue;
    }

    if (extraPool <= 0) break;

    const payment = roundMoney(Math.min(debt.balance, extraPool));
    debt.balance = roundMoney(debt.balance - payment);
    extraPool = roundMoney(extraPool - payment);

    const detail = paymentMap.get(debt.id)!;
    detail.extraPaid = roundMoney(detail.extraPaid + payment);
    detail.totalPaid = roundMoney(detail.totalPaid + payment);
    detail.balanceAfter = debt.balance;

    if (!isDebtActive(debt)) {
      extraPool = roundMoney(extraPool + debt.minimumPayment);
    }
  }

  const totalPaid = roundMoney(
    payments.reduce((sum, p) => sum + p.totalPaid, 0)
  );
  const totalInterest = roundMoney(
    payments.reduce((sum, p) => sum + p.interestCharged, 0)
  );

  return {
    month: 0,
    focusDebtId: focus?.id ?? "",
    focusDebtName: focus?.name ?? "",
    totalPaid,
    totalInterest,
    remainingTotalBalance: roundMoney(totalBalance(debts)),
    payments,
  };
}

/**
 * Motor principal: calcula meses hasta RD$ 0 y genera el cronograma paso a paso.
 */
export function simulateDebtPayoff(
  options: SimulationOptions
): SimulationResult {
  const {
    debts: inputDebts,
    strategy,
    extraAcceleration,
    exchangeRate = DEFAULT_EXCHANGE_RATE,
    maxMonths = DEFAULT_MAX_MONTHS,
  } = options;

  const debts = cloneDebts(inputDebts);
  const schedule: MonthlyScheduleEntry[] = [];
  let totalInterestPaid = 0;
  let totalPaid = 0;
  let month = 0;
  let incomplete = false;

  if (debts.length === 0) {
    return {
      strategy,
      monthsToFreedom: 0,
      totalInterestPaid: 0,
      totalPaid: 0,
      schedule: [],
      incomplete: false,
    };
  }

  while (totalBalance(debts) > BALANCE_EPSILON && month < maxMonths) {
    month += 1;
    const entry = simulateMonth(debts, strategy, extraAcceleration, exchangeRate);
    entry.month = month;

    schedule.push(entry);
    totalInterestPaid = roundMoney(totalInterestPaid + entry.totalInterest);
    totalPaid = roundMoney(totalPaid + entry.totalPaid);
  }

  if (totalBalance(debts) > BALANCE_EPSILON) {
    incomplete = true;
  }

  return {
    strategy,
    monthsToFreedom: incomplete ? month : month,
    totalInterestPaid,
    totalPaid,
    schedule,
    incomplete,
  };
}

/**
 * Compara ambas estrategias con los mismos datos de entrada.
 */
export function compareStrategies(
  debts: DebtInput[],
  extraAcceleration: number
): { snowball: SimulationResult; avalanche: SimulationResult } {
  return {
    snowball: simulateDebtPayoff({
      debts,
      strategy: "snowball",
      extraAcceleration,
    }),
    avalanche: simulateDebtPayoff({
      debts,
      strategy: "avalanche",
      extraAcceleration,
    }),
  };
}
