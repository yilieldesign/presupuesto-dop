import { describe, expect, it } from "vitest";
import { compareStrategies, simulateDebtPayoff } from "./engine";

describe("simulateDebtPayoff", () => {
  const sampleDebts = [
    {
      id: "1",
      name: "Tarjeta A",
      currency: "DOP" as const,
      balance: 5000,
      interestRate: 24,
      minimumPayment: 150,
    },
    {
      id: "2",
      name: "Préstamo B",
      currency: "DOP" as const,
      balance: 12000,
      interestRate: 18,
      minimumPayment: 300,
    },
    {
      id: "3",
      name: "Tarjeta C",
      currency: "DOP" as const,
      balance: 2500,
      interestRate: 36,
      minimumPayment: 75,
    },
  ];

  it("liquida todas las deudas en un número finito de meses", () => {
    const result = simulateDebtPayoff({
      debts: sampleDebts,
      strategy: "snowball",
      extraAcceleration: 500,
    });

    expect(result.incomplete).toBe(false);
    expect(result.monthsToFreedom).toBeGreaterThan(0);
    expect(result.schedule.at(-1)?.remainingTotalBalance).toBe(0);
  });

  it("bola de nieve ataca la deuda de menor saldo primero", () => {
    const result = simulateDebtPayoff({
      debts: sampleDebts,
      strategy: "snowball",
      extraAcceleration: 500,
    });

    const firstMonth = result.schedule[0];
    expect(firstMonth.focusDebtName).toBe("Tarjeta C");
  });

  it("avalancha ataca la deuda de mayor interés primero", () => {
    const result = simulateDebtPayoff({
      debts: sampleDebts,
      strategy: "avalanche",
      extraAcceleration: 500,
    });

    const firstMonth = result.schedule[0];
    expect(firstMonth.focusDebtName).toBe("Tarjeta C");
  });

  it("genera un cronograma con un paso por mes", () => {
    const result = simulateDebtPayoff({
      debts: sampleDebts,
      strategy: "avalanche",
      extraAcceleration: 200,
    });

    expect(result.schedule).toHaveLength(result.monthsToFreedom);
    result.schedule.forEach((entry, index) => {
      expect(entry.month).toBe(index + 1);
      expect(entry.payments.length).toBe(sampleDebts.length);
    });
  });

  it("el extra de aceleración reduce los meses totales", () => {
    const withoutExtra = simulateDebtPayoff({
      debts: sampleDebts,
      strategy: "snowball",
      extraAcceleration: 0,
    });

    const withExtra = simulateDebtPayoff({
      debts: sampleDebts,
      strategy: "snowball",
      extraAcceleration: 1000,
    });

    expect(withExtra.monthsToFreedom).toBeLessThan(withoutExtra.monthsToFreedom);
  });

  it("compareStrategies devuelve ambos resultados", () => {
    const comparison = compareStrategies(sampleDebts, 300);

    expect(comparison.snowball.strategy).toBe("snowball");
    expect(comparison.avalanche.strategy).toBe("avalanche");
    expect(comparison.snowball.schedule.length).toBeGreaterThan(0);
    expect(comparison.avalanche.schedule.length).toBeGreaterThan(0);
  });
});
