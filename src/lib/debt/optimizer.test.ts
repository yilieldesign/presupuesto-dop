import { describe, expect, it } from "vitest";
import { applyCashOptimization, optimizeCashInjection } from "./optimizer";

const RATE = 58.5;

const sampleDebts = [
  {
    id: "a",
    name: "Deuda A",
    currency: "DOP" as const,
    balance: 10000,
    interestRate: 18,
    minimumPayment: 4800,
  },
  {
    id: "b",
    name: "Deuda B",
    currency: "DOP" as const,
    balance: 8000,
    interestRate: 36,
    minimumPayment: 3200,
  },
];

describe("optimizeCashInjection", () => {
  it("cubre mínimos semanales y asigna excedente por bola de nieve", () => {
    const result = optimizeCashInjection({
      cashAmount: 7500,
      debts: sampleDebts,
      strategy: "snowball",
      exchangeRate: RATE,
    });

    expect(result.totalWeeklyMinimumsRequired).toBe(2000);
    expect(result.totalAllocatedToMinimums).toBe(2000);
    expect(result.totalExtraInjection).toBe(5500);
    expect(result.priorityDebtName).toBe("Deuda B");
    expect(result.unallocated).toBe(0);
  });

  it("reserva primero el fondo vital pendiente de la semana", () => {
    const result = optimizeCashInjection({
      cashAmount: 7500,
      debts: sampleDebts,
      strategy: "snowball",
      exchangeRate: RATE,
      weeklyFixedFund: 5000,
      weekFundSpent: 3000,
    });

    expect(result.vitalFundReserved).toBe(2000);
    expect(result.totalExtraInjection).toBe(3500);
    expect(result.totalAssigned).toBe(7500);
  });

  it("convierte deudas en USD y asigna pagos en dólares", () => {
    const result = optimizeCashInjection({
      cashAmount: 10000,
      debts: [
        {
          id: "usd",
          name: "Tarjeta Visa USD",
          currency: "USD",
          balance: 500,
          interestRate: 22,
          minimumPayment: 100,
        },
      ],
      strategy: "snowball",
      exchangeRate: RATE,
    });

    // Mínimo semanal: US$25 ≈ RD$1,462.50
    const minimum = result.allocations.find((a) => a.type === "weekly_minimum");
    expect(minimum?.currency).toBe("USD");
    expect(minimum?.amount).toBe(25);
    expect(minimum?.amountDOP).toBe(1462.5);

    const extra = result.allocations.find((a) => a.type === "extra_injection");
    expect(extra?.currency).toBe("USD");
    // RD$10,000 - RD$1,462.50 mínimo ≈ RD$8,537.50 → US$145.94 a tasa 58.5
    expect(extra?.amount).toBe(145.94);
    expect(extra?.amountDOP).toBeCloseTo(8537.5, 1);
  });

  it("prioriza deuda USD pequeña en bola de nieve con tasa de cambio", () => {
    const result = optimizeCashInjection({
      cashAmount: 20000,
      debts: [
        {
          id: "dop",
          name: "Préstamo RD$",
          currency: "DOP",
          balance: 5000,
          interestRate: 18,
          minimumPayment: 1000,
        },
        {
          id: "usd",
          name: "Tarjeta US$",
          currency: "USD",
          balance: 50,
          interestRate: 24,
          minimumPayment: 25,
        },
      ],
      strategy: "snowball",
      exchangeRate: RATE,
    });

    const extra = result.allocations.find((a) => a.type === "extra_injection");
    // US$50 × 58.5 = RD$2,925 < RD$5,000 → prioridad bola de nieve es la tarjeta USD
    expect(extra?.debtName).toBe("Tarjeta US$");
  });

  it("applyCashOptimization actualiza saldos en moneda nativa", () => {
    const usdDebt = [
      {
        id: "usd",
        name: "Tarjeta USD",
        currency: "USD" as const,
        balance: 200,
        interestRate: 22,
        minimumPayment: 80,
      },
    ];

    const result = optimizeCashInjection({
      cashAmount: 15000,
      debts: usdDebt,
      strategy: "snowball",
      exchangeRate: RATE,
    });

    const updated = applyCashOptimization(usdDebt, result.allocations);
    expect(updated[0].balance).toBeLessThan(200);
    expect(updated[0].currency).toBe("USD");
  });
});
