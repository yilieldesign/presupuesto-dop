import { toDOP } from "@/lib/currency/convert";
import type { AppState, Debt, Transaction } from "@/types";

export function debtBalanceInDOP(debt: Debt, exchangeRate: number): number {
  return toDOP(debt.balance, debt.currency, exchangeRate);
}

export function getTotalDebtBalance(
  debts: AppState["debts"],
  exchangeRate: number
): number {
  return debts.reduce(
    (sum, d) => sum + Math.max(0, debtBalanceInDOP(d, exchangeRate)),
    0
  );
}

export function getOriginalDebtTotal(
  debts: AppState["debts"],
  exchangeRate: number
): number {
  return debts.reduce(
    (sum, d) => sum + toDOP(d.originalBalance, d.currency, exchangeRate),
    0
  );
}

export function getDebtPaydownProgress(
  debts: AppState["debts"],
  exchangeRate: number
): number {
  const original = getOriginalDebtTotal(debts, exchangeRate);
  if (original <= 0) return 0;
  const current = getTotalDebtBalance(debts, exchangeRate);
  const paid = original - current;
  return Math.min(100, Math.max(0, (paid / original) * 100));
}

export function getDebtsByCurrency(debts: Debt[]) {
  const dop = debts.filter((d) => d.currency === "DOP");
  const usd = debts.filter((d) => d.currency === "USD");
  return { dop, usd };
}

export function getTotalInjectedToDebts(
  injections: AppState["injections"]
): number {
  return injections.reduce((sum, i) => sum + i.totalToDebts, 0);
}

export function getWeeklyIncome(transactions: Transaction[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return transactions
    .filter(
      (t) => t.type === "income" && new Date(t.date).getTime() >= weekAgo
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getWeeklyExpenses(transactions: Transaction[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return transactions
    .filter(
      (t) => t.type === "expense" && new Date(t.date).getTime() >= weekAgo
    )
    .reduce((sum, t) => sum + t.amount, 0);
}
