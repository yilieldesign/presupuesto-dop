import { toDateKey, startOfDay } from "@/lib/budget/fixedExpenses";
import type { Transaction } from "@/types";

export interface DailySummary {
  dateKey: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

function isSameDay(txDate: string, day: Date): boolean {
  return toDateKey(new Date(txDate)) === toDateKey(day);
}

export function getTransactionsForDay(
  transactions: Transaction[],
  day: Date = new Date()
): Transaction[] {
  return transactions.filter((tx) => isSameDay(tx.date, day));
}

export function getDailySummary(
  transactions: Transaction[],
  day: Date = new Date()
): DailySummary {
  const dayTx = getTransactionsForDay(transactions, day);
  let income = 0;
  let expenses = 0;

  for (const tx of dayTx) {
    if (tx.type === "income") income += tx.amount;
    else if (tx.type === "expense") expenses += tx.amount;
  }

  const label = startOfDay(day).toLocaleDateString("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return {
    dateKey: toDateKey(day),
    label,
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    net: Math.round((income - expenses) * 100) / 100,
  };
}
