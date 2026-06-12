import { getMonthKey } from "@/lib/budget/fixedExpenses";
import type { Transaction } from "@/types";

export interface MonthlySummary {
  monthKey: string;
  label: string;
  income: number;
  expenses: number;
  debtPayments: number;
  totalPaid: number;
  net: number;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("es-DO", {
    month: "long",
    year: "numeric",
  });
}

function transactionMonthKey(date: string): string {
  return getMonthKey(new Date(date));
}

/** Agrupa movimientos por mes (YYYY-MM). */
export function getMonthlySummaries(
  transactions: Transaction[]
): MonthlySummary[] {
  const map = new Map<
    string,
    { income: number; expenses: number; debtPayments: number }
  >();

  for (const tx of transactions) {
    const key = transactionMonthKey(tx.date);
    const bucket = map.get(key) ?? {
      income: 0,
      expenses: 0,
      debtPayments: 0,
    };

    if (tx.type === "income") {
      bucket.income += tx.amount;
    } else if (tx.type === "expense") {
      bucket.expenses += tx.amount;
    } else if (tx.type === "debt_payment") {
      bucket.debtPayments += tx.amount;
    }

    map.set(key, bucket);
  }

  return Array.from(map.entries())
    .map(([monthKey, data]) => {
      const totalPaid = data.expenses + data.debtPayments;
      return {
        monthKey,
        label: monthLabel(monthKey),
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        debtPayments: Math.round(data.debtPayments * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        net: Math.round((data.income - totalPaid) * 100) / 100,
      };
    })
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export function getCurrentMonthSummary(
  transactions: Transaction[],
  now: Date = new Date()
): MonthlySummary {
  const monthKey = getMonthKey(now);
  const existing = getMonthlySummaries(transactions).find(
    (m) => m.monthKey === monthKey
  );

  if (existing) return existing;

  return {
    monthKey,
    label: monthLabel(monthKey),
    income: 0,
    expenses: 0,
    debtPayments: 0,
    totalPaid: 0,
    net: 0,
  };
}

export function getAvailableMonthKeys(
  transactions: Transaction[],
  now: Date = new Date()
): string[] {
  const keys = new Set(getMonthlySummaries(transactions).map((m) => m.monthKey));
  keys.add(getMonthKey(now));
  return Array.from(keys).sort((a, b) => b.localeCompare(a));
}

export function getSummaryForMonth(
  transactions: Transaction[],
  monthKey: string
): MonthlySummary {
  return (
    getMonthlySummaries(transactions).find((m) => m.monthKey === monthKey) ??
    {
      monthKey,
      label: monthLabel(monthKey),
      income: 0,
      expenses: 0,
      debtPayments: 0,
      totalPaid: 0,
      net: 0,
    }
  );
}
