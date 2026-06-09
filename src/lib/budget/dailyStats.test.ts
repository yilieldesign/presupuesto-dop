import { describe, expect, it } from "vitest";
import { getDailySummary, getTransactionsForDay } from "./dailyStats";
import type { Transaction } from "@/types";

const txs: Transaction[] = [
  {
    id: "1",
    type: "expense",
    amount: 500,
    category: "comida",
    description: "Almuerzo",
    date: "2026-06-08T10:00:00.000Z",
  },
  {
    id: "2",
    type: "expense",
    amount: 200,
    category: "transporte",
    description: "Metro",
    date: "2026-06-08T18:00:00.000Z",
  },
  {
    id: "3",
    type: "income",
    amount: 5000,
    description: "Evento",
    date: "2026-06-08T12:00:00.000Z",
  },
  {
    id: "4",
    type: "expense",
    amount: 100,
    category: "comida",
    description: "Ayer",
    date: "2026-06-07T12:00:00.000Z",
  },
];

describe("dailyStats", () => {
  it("suma gastos del día", () => {
    const day = new Date(2026, 5, 8);
    const summary = getDailySummary(txs, day);
    expect(summary.expenses).toBe(700);
    expect(summary.income).toBe(5000);
    expect(summary.net).toBe(4300);
  });

  it("filtra transacciones por día", () => {
    const day = new Date(2026, 5, 8);
    expect(getTransactionsForDay(txs, day)).toHaveLength(3);
  });
});
