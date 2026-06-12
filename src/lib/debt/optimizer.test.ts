import { describe, expect, it } from "vitest";
import {
  adjustOptimizationResult,
  applyCashOptimization,
  getAllocationLineKey,
  optimizeCashInjection,
  VITAL_FUND_LINE_KEY,
} from "./optimizer";
import type { SchedulableDebt } from "./debtSchedule";

const RATE = 58.5;
const NOW = new Date("2026-06-08T12:00:00");

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
  it("sin fechas urgentes, todo el excedente va a atacar deuda por estrategia", () => {
    const result = optimizeCashInjection({
      cashAmount: 7500,
      debts: sampleDebts,
      strategy: "snowball",
      exchangeRate: RATE,
      now: NOW,
    });

    expect(result.totalCommitmentsRequired).toBe(0);
    expect(result.totalAllocatedToCommitments).toBe(0);
    expect(result.totalExtraInjection).toBe(7500);
    expect(result.priorityDebtName).toBe("Deuda B");
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].type).toBe("extra_injection");
    expect(result.unallocated).toBe(0);
  });

  it("cubre mínimo mensual completo de deuda con fecha urgente antes del ataque", () => {
    const schedule: SchedulableDebt[] = [
      {
        id: "card",
        name: "Tarjeta",
        currency: "DOP",
        balance: 10000,
        interestRate: 24,
        minimumPayment: 4800,
        paymentPriority: "scheduled",
        nextPaymentDate: "2026-06-10",
        dayOfMonth: 10,
      },
      {
        id: "flex",
        name: "Préstamo flexible",
        currency: "DOP",
        balance: 8000,
        interestRate: 18,
        minimumPayment: 3200,
        paymentPriority: "flexible",
      },
    ];

    const result = optimizeCashInjection({
      cashAmount: 10000,
      debts: schedule.map((d) => ({
        id: d.id,
        name: d.name,
        currency: d.currency,
        balance: d.balance,
        interestRate: d.interestRate,
        minimumPayment: d.minimumPayment,
      })),
      strategy: "snowball",
      exchangeRate: RATE,
      debtSchedule: schedule,
      now: NOW,
    });

    const commitment = result.allocations.find(
      (a) => a.type === "commitment_payment"
    );
    expect(commitment?.debtName).toBe("Tarjeta");
    expect(commitment?.amount).toBe(4800);
    expect(result.totalAllocatedToCommitments).toBe(4800);
    expect(result.totalExtraInjection).toBe(5200);
    expect(result.priorityByDueDate).toBe(true);
  });

  it("reserva primero el fondo vital pendiente de la semana", () => {
    const result = optimizeCashInjection({
      cashAmount: 7500,
      debts: sampleDebts,
      strategy: "snowball",
      exchangeRate: RATE,
      weeklyFixedFund: 5000,
      weekFundSpent: 3000,
      now: NOW,
    });

    expect(result.vitalFundReserved).toBe(2000);
    expect(result.totalExtraInjection).toBe(5500);
    expect(result.totalAssigned).toBe(7500);
  });

  it("deuda USD flexible recibe todo como inyección extra", () => {
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
      now: NOW,
    });

    expect(result.totalCommitmentsRequired).toBe(0);
    expect(result.allocations).toHaveLength(1);

    const extra = result.allocations.find((a) => a.type === "extra_injection");
    expect(extra?.currency).toBe("USD");
    expect(extra?.amount).toBe(170.94);
    expect(extra?.amountDOP).toBeCloseTo(10000, 0);
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
      now: NOW,
    });

    const extra = result.allocations.find((a) => a.type === "extra_injection");
    expect(extra?.debtName).toBe("Tarjeta US$");
  });

  it("marca insuficiencia cuando no alcanza para compromisos urgentes", () => {
    const schedule: SchedulableDebt[] = [
      {
        id: "card",
        name: "Tarjeta",
        currency: "DOP",
        balance: 10000,
        interestRate: 24,
        minimumPayment: 4800,
        paymentPriority: "scheduled",
        nextPaymentDate: "2026-06-05",
        dayOfMonth: 5,
      },
    ];

    const result = optimizeCashInjection({
      cashAmount: 3000,
      debts: [
        {
          id: "card",
          name: "Tarjeta",
          currency: "DOP",
          balance: 10000,
          interestRate: 24,
          minimumPayment: 4800,
        },
      ],
      strategy: "snowball",
      exchangeRate: RATE,
      debtSchedule: schedule,
      now: NOW,
    });

    expect(result.insufficientForCommitments).toBe(true);
    expect(result.totalAllocatedToCommitments).toBe(3000);
    expect(result.totalExtraInjection).toBe(0);
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
      now: NOW,
    });

    const updated = applyCashOptimization(usdDebt, result.allocations);
    expect(updated[0].balance).toBeLessThan(200);
    expect(updated[0].currency).toBe("USD");
  });

  it("prioriza gasto fijo vencido antes de atacar deudas flexibles", () => {
    const fixedExpenses = [
      {
        id: "rent",
        name: "Alquiler",
        amount: 5000,
        category: "vivienda" as const,
        dayOfMonth: 5,
        nextPaymentDate: "2026-06-05",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const result = optimizeCashInjection({
      cashAmount: 12000,
      debts: sampleDebts,
      fixedExpenses,
      strategy: "snowball",
      exchangeRate: RATE,
      now: NOW,
    });

    const fixed = result.allocations.find((a) => a.type === "fixed_expense_payment");
    expect(fixed?.debtName).toBe("Alquiler");
    expect(fixed?.amountDOP).toBe(5000);
    expect(result.totalAllocatedToFixedExpenses).toBe(5000);
    expect(result.totalExtraInjection).toBe(7000);
    expect(result.allocations[0].type).toBe("fixed_expense_payment");
  });

  it("gasto fijo vencido tiene prioridad sobre deuda con fecha próxima", () => {
    const fixedExpenses = [
      {
        id: "rent",
        name: "Alquiler",
        amount: 4000,
        category: "vivienda" as const,
        dayOfMonth: 5,
        nextPaymentDate: "2026-06-05",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const schedule = [
      {
        id: "card",
        name: "Tarjeta",
        currency: "DOP" as const,
        balance: 10000,
        interestRate: 24,
        minimumPayment: 4800,
        paymentPriority: "scheduled" as const,
        nextPaymentDate: "2026-06-10",
        dayOfMonth: 10,
      },
    ];

    const result = optimizeCashInjection({
      cashAmount: 10000,
      debts: schedule.map((d) => ({
        id: d.id,
        name: d.name,
        currency: d.currency,
        balance: d.balance,
        interestRate: d.interestRate,
        minimumPayment: d.minimumPayment,
      })),
      fixedExpenses,
      strategy: "snowball",
      exchangeRate: RATE,
      debtSchedule: schedule,
      now: NOW,
    });

    expect(result.allocations[0].debtName).toBe("Alquiler");
    expect(result.allocations[1].debtName).toBe("Tarjeta");
  });
});

describe("adjustOptimizationResult", () => {
  it("recalcula saldos al quitar un compromiso pero mantener la inyección", () => {
    const schedule = [
      {
        id: "card",
        name: "Tarjeta",
        currency: "DOP" as const,
        balance: 10000,
        interestRate: 24,
        minimumPayment: 4800,
        paymentPriority: "scheduled" as const,
        nextPaymentDate: "2026-06-10",
        dayOfMonth: 10,
      },
      {
        id: "flex",
        name: "Préstamo flexible",
        currency: "DOP" as const,
        balance: 8000,
        interestRate: 18,
        minimumPayment: 3200,
        paymentPriority: "flexible" as const,
      },
    ];

    const original = optimizeCashInjection({
      cashAmount: 10000,
      debts: schedule.map((d) => ({
        id: d.id,
        name: d.name,
        currency: d.currency,
        balance: d.balance,
        interestRate: d.interestRate,
        minimumPayment: d.minimumPayment,
      })),
      strategy: "snowball",
      exchangeRate: RATE,
      debtSchedule: schedule,
      now: NOW,
    });

    const commitment = original.allocations.find(
      (a) => a.type === "commitment_payment"
    )!;
    const adjusted = adjustOptimizationResult(original, new Set([
      getAllocationLineKey(commitment),
    ]));

    expect(adjusted.totalAllocatedToCommitments).toBe(0);
    expect(adjusted.totalExtraInjection).toBe(5200);
    expect(adjusted.unallocated).toBe(4800);
    expect(adjusted.allocations).toHaveLength(1);
    expect(adjusted.allocations[0].debtName).toBe("Tarjeta");
    expect(adjusted.allocations[0].balanceBefore).toBe(10000);
    expect(adjusted.allocations[0].balanceAfter).toBe(4800);
  });

  it("libera dinero al quitar fondo vital y pagos de deuda", () => {
    const original = optimizeCashInjection({
      cashAmount: 7500,
      debts: sampleDebts,
      strategy: "snowball",
      exchangeRate: RATE,
      weeklyFixedFund: 5000,
      weekFundSpent: 3000,
      now: NOW,
    });

    const extra = original.allocations.find(
      (a) => a.type === "extra_injection"
    )!;

    const adjusted = adjustOptimizationResult(original, new Set([
      VITAL_FUND_LINE_KEY,
      getAllocationLineKey(extra),
    ]));

    expect(adjusted.vitalFundReserved).toBe(0);
    expect(adjusted.totalAllocated).toBe(0);
    expect(adjusted.totalAssigned).toBe(0);
    expect(adjusted.unallocated).toBe(7500);
  });
});
