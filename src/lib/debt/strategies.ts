import { toDOP } from "@/lib/currency/convert";
import type { DebtStrategy } from "@/types";
import type { SimDebt } from "./types";

const BALANCE_EPSILON = 0.01;

export function isDebtActive(debt: SimDebt): boolean {
  return debt.balance > BALANCE_EPSILON;
}

function effectiveBalanceDOP(debt: SimDebt, exchangeRate: number): number {
  return toDOP(debt.balance, debt.currency, exchangeRate);
}

/**
 * Ordena deudas activas según la estrategia elegida.
 * Los saldos en USD se comparan convertidos a RD$ con la tasa configurada.
 */
export function sortDebtsByStrategy(
  debts: SimDebt[],
  strategy: DebtStrategy,
  exchangeRate: number
): SimDebt[] {
  const active = debts.filter(isDebtActive);

  if (strategy === "snowball") {
    return [...active].sort(
      (a, b) =>
        effectiveBalanceDOP(a, exchangeRate) -
        effectiveBalanceDOP(b, exchangeRate)
    );
  }

  return [...active].sort((a, b) => {
    if (b.interestRate !== a.interestRate) {
      return b.interestRate - a.interestRate;
    }
    return (
      effectiveBalanceDOP(a, exchangeRate) -
      effectiveBalanceDOP(b, exchangeRate)
    );
  });
}

/** Convierte tasa anual (%) a tasa mensual decimal. */
export function annualToMonthlyRate(annualPercent: number): number {
  return annualPercent / 100 / 12;
}
