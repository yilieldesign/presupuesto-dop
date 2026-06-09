export type DebtStrategy = "snowball" | "avalanche";

export type Currency = "DOP" | "USD";

export type ExpenseCategory =
  | "vivienda"
  | "comida"
  | "combustible"
  | "transporte"
  | "salud"
  | "entretenimiento"
  | "educacion"
  | "servicios"
  | "herramientas"
  | "otros";

export type TransactionType = "income" | "expense" | "debt_payment";

export type TabId = "budget" | "debts" | "progress" | "savings";

export type SavingsGoalCategory =
  | "emergency"
  | "equipment"
  | "buffer"
  | "personal"
  | "other";

export interface SavingsGoal {
  id: string;
  name: string;
  category: SavingsGoalCategory;
  targetAmount: number;
  balance: number;
  createdAt: string;
}

export interface SavingsDeposit {
  id: string;
  goalId: string;
  goalName: string;
  amount: number;
  date: string;
  note?: string;
}

export type VitalFundCategory =
  | "comida"
  | "combustible"
  | "transporte"
  | "herramientas"
  | "servicios"
  | "otros";

export interface WeeklyFundItem {
  id: string;
  category: VitalFundCategory;
  amount: number;
}

export interface Debt {
  id: string;
  name: string;
  currency: Currency;
  balance: number;
  originalBalance: number;
  interestRate: number;
  minimumPayment: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category?: ExpenseCategory;
  description: string;
  date: string;
}

export interface InjectionAllocation {
  debtId: string;
  debtName: string;
  type: "weekly_minimum" | "extra_injection";
  currency: Currency;
  amount: number;
  amountDOP: number;
}

export interface CashInjection {
  id: string;
  amount: number;
  date: string;
  strategy: DebtStrategy;
  allocations: InjectionAllocation[];
  totalToDebts: number;
  vitalFundReserved: number;
}

export interface AppState {
  debts: Debt[];
  transactions: Transaction[];
  injections: CashInjection[];
  extraAcceleration: number;
  debtStrategy: DebtStrategy;
  /** Tasa de compra USD → RD$ (ej. 58.50). */
  exchangeRate: number;
  /** ISO timestamp de la última actualización de tasa. */
  exchangeRateUpdatedAt: string | null;
  /** true = se actualiza sola; false = el usuario la fijó manualmente. */
  exchangeRateAuto: boolean;
  /** Rubros del fondo vital semanal (comida, combustible, etc.). */
  weeklyFundItems: WeeklyFundItem[];
  weekFundCategorySpent: Partial<Record<VitalFundCategory, number>>;
  weekFundWeekKey: string;
  savingsGoals: SavingsGoal[];
  savingsDeposits: SavingsDeposit[];
  /** false = muestra bienvenida de primer uso. */
  onboardingDone: boolean;
}

export const DEFAULT_APP_STATE: AppState = {
  debts: [],
  transactions: [],
  injections: [],
  extraAcceleration: 0,
  debtStrategy: "snowball",
  exchangeRate: 58.5,
  exchangeRateUpdatedAt: null,
  exchangeRateAuto: true,
  weeklyFundItems: [],
  weekFundCategorySpent: {},
  weekFundWeekKey: "",
  savingsGoals: [],
  savingsDeposits: [],
  onboardingDone: false,
};
