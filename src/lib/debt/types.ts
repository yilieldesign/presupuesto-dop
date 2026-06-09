import type { Currency, DebtStrategy } from "@/types";

/** Deuda en el motor de simulación (copia mutable del estado). */
export interface SimDebt {
  id: string;
  name: string;
  currency: Currency;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

export interface DebtInput {
  id: string;
  name: string;
  currency: Currency;
  balance: number;
  /** Tasa de interés anual en porcentaje (ej. 24 = 24% APR). */
  interestRate: number;
  minimumPayment: number;
}

export interface SimulationOptions {
  debts: DebtInput[];
  strategy: DebtStrategy;
  /** Monto extra mensual de aceleración (RD$). */
  extraAcceleration: number;
  /** Tasa USD → RD$ para comparar deudas mixtas. */
  exchangeRate?: number;
  /** Tope de meses para evitar bucles infinitos. */
  maxMonths?: number;
}

/** Detalle de un pago aplicado a una deuda en un mes. */
export interface DebtPaymentDetail {
  debtId: string;
  debtName: string;
  interestCharged: number;
  minimumPaid: number;
  extraPaid: number;
  totalPaid: number;
  balanceAfter: number;
}

/** Cronograma de un mes dentro de la simulación. */
export interface MonthlyScheduleEntry {
  month: number;
  focusDebtId: string;
  focusDebtName: string;
  totalPaid: number;
  totalInterest: number;
  remainingTotalBalance: number;
  payments: DebtPaymentDetail[];
}

export interface SimulationResult {
  strategy: DebtStrategy;
  monthsToFreedom: number;
  totalInterestPaid: number;
  totalPaid: number;
  schedule: MonthlyScheduleEntry[];
  /** true si se alcanzó maxMonths sin liquidar todas las deudas. */
  incomplete: boolean;
}
