import { describe, expect, it } from "vitest";
import {
  getCurrentMonthSummary,
  getMonthlySummaries,
  getSummaryForMonth,
} from "./monthlyStats";
import type { Transaction } from "@/types";

const txs: Transaction[] = [
  {
    id: "1",
    type: "income",
    amount: 15000,
    description: "Evento",
    date: "2026-06-05T12:00:00.000Z",
  },
  {
    id: "2",
    type: "expense",
    amount: 3000,
    category: "comida",
    description: "Super",
    date: "2026-06-08T12:00:00.000Z",
  },
  {
    id: "3",
    type: "debt_payment",
    amount: 5000,
    description: "Tarjeta",
    date: "2026-06-10T12:00:00.000Z",
  },
  {
    id: "4",
    type: "income",
    amount: 8000,
    description: "Evento mayo",
    date: "2026-05-12T12:00:00.000Z",
  },
];

describe("monthlyStats", () => {
  it("agrupa ingresos y pagos por mes", () => {
    const summaries = getMonthlySummaries(txs);
    expect(summaries).toHaveLength(2);
    expect(summaries[0].monthKey).toBe("2026-06");
    expect(summaries[0].income).toBe(15000);
    expect(summaries[0].expenses).toBe(3000);
    expect(summaries[0].debtPayments).toBe(5000);
    expect(summaries[0].totalPaid).toBe(8000);
    expect(summaries[0].net).toBe(7000);
  });

  it("devuelve mes actual vacío si no hay datos", () => {
    const now = new Date(2026, 5, 15);
    const summary = getCurrentMonthSummary([], now);
    expect(summary.monthKey).toBe("2026-06");
    expect(summary.income).toBe(0);
    expect(summary.totalPaid).toBe(0);
  });

  it("obtiene resumen de un mes específico", () => {
    const may = getSummaryForMonth(txs, "2026-05");
    expect(may.income).toBe(8000);
    expect(may.totalPaid).toBe(0);
  });
});
