import { describe, expect, it } from "vitest";
import {
  canMarkDebtMinimumPaid,
  getDebtMinimumPaidUpdate,
  needsMinimumUpdate,
  getDebtPaymentAlerts,
  getExtraInjectionPriority,
  getDebtDueStatus,
} from "./debtSchedule";
import type { Debt } from "@/types";

const scheduled: Debt = {
  id: "card",
  name: "Tarjeta Visa",
  currency: "USD",
  balance: 500,
  originalBalance: 500,
  interestRate: 24,
  minimumPayment: 25,
  paymentPriority: "scheduled",
  nextPaymentDate: "2026-06-10",
  dayOfMonth: 10,
  createdAt: "",
};

const flexible: Debt = {
  id: "loan",
  name: "Préstamo",
  currency: "DOP",
  balance: 10000,
  originalBalance: 10000,
  interestRate: 18,
  minimumPayment: 2000,
  paymentPriority: "flexible",
  createdAt: "",
};

describe("debtSchedule", () => {
  it("detecta deuda programada próxima a vencer", () => {
    const now = new Date(2026, 5, 8);
    expect(getDebtDueStatus(scheduled, now)).toBe("upcoming");
    const alerts = getDebtPaymentAlerts([scheduled], now);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].daysUntil).toBe(2);
  });

  it("prioriza deuda con fecha urgente sobre estrategia", () => {
    const now = new Date(2026, 5, 9);
    const scheduleById = new Map([
      [scheduled.id, scheduled],
      [flexible.id, flexible],
    ]);
    const { debt, byDueDate } = getExtraInjectionPriority(
      [
        {
          id: flexible.id,
          name: flexible.name,
          currency: flexible.currency,
          balance: flexible.balance,
          interestRate: flexible.interestRate,
          minimumPayment: flexible.minimumPayment,
        },
        {
          id: scheduled.id,
          name: scheduled.name,
          currency: scheduled.currency,
          balance: scheduled.balance,
          interestRate: scheduled.interestRate,
          minimumPayment: scheduled.minimumPayment,
        },
      ],
      "snowball",
      58.5,
      scheduleById,
      now
    );
    expect(debt?.id).toBe("card");
    expect(byDueDate).toBe(true);
  });

  it("detecta cuando el mínimo del mes no está actualizado", () => {
    const now = new Date(2026, 5, 8);
    expect(
      needsMinimumUpdate(
        { ...scheduled, minimumPaymentMonthKey: "2026-05" },
        now
      )
    ).toBe(true);
    expect(
      needsMinimumUpdate(
        { ...scheduled, minimumPaymentMonthKey: "2026-06" },
        now
      )
    ).toBe(false);
  });

  it("permite marcar mínimo pagado y avanza el ciclo", () => {
    const now = new Date(2026, 5, 8);
    expect(canMarkDebtMinimumPaid(scheduled, now)).toBe(true);
    const patch = getDebtMinimumPaidUpdate(scheduled, now);
    expect(patch?.lastPaidMonthKey).toBe("2026-06");
    expect(patch?.balance).toBe(475);
    expect(patch?.nextPaymentDate).toBe("2026-07-10");
    expect(canMarkDebtMinimumPaid({ ...scheduled, ...patch }, now)).toBe(false);
  });

  it("usa estrategia si no hay deudas urgentes por fecha", () => {
    const now = new Date(2026, 5, 1);
    const scheduleById = new Map([
      [scheduled.id, scheduled],
      [flexible.id, flexible],
    ]);
    const { debt, byDueDate } = getExtraInjectionPriority(
      [
        {
          id: flexible.id,
          name: flexible.name,
          currency: flexible.currency,
          balance: flexible.balance,
          interestRate: flexible.interestRate,
          minimumPayment: flexible.minimumPayment,
        },
        {
          id: scheduled.id,
          name: scheduled.name,
          currency: scheduled.currency,
          balance: scheduled.balance,
          interestRate: scheduled.interestRate,
          minimumPayment: scheduled.minimumPayment,
        },
      ],
      "snowball",
      58.5,
      scheduleById,
      now
    );
    expect(debt?.id).toBe("loan");
    expect(byDueDate).toBe(false);
  });
});
