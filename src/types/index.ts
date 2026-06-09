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

export type DebtPaymentPriority = "scheduled" | "flexible";

export interface Debt {
  id: string;
  name: string;
  currency: Currency;
  balance: number;
  originalBalance: number;
  interestRate: number;
  minimumPayment: number;
  /** Mes al que corresponde el mínimo actual (YYYY-MM). */
  minimumPaymentMonthKey?: string;
  /** scheduled = tarjeta con fecha mensual; flexible = se paga al paso. */
  paymentPriority: DebtPaymentPriority;
  /** Próximo pago obligatorio (YYYY-MM-DD), solo si scheduled. */
  nextPaymentDate?: string;
  dayOfMonth?: number;
  lastPaidMonthKey?: string;
  lastNotifiedKey?: string;
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

/** Gasto fijo mensual agendado (alquiler, internet, etc.). */
export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  /** Próxima fecha de pago (YYYY-MM-DD). */
  nextPaymentDate: string;
  /** Día del mes para recurrencia (1–31). */
  dayOfMonth: number;
  /** Último mes pagado, formato YYYY-MM. */
  lastPaidMonthKey?: string;
  /** Recordatorio activo para este gasto. */
  reminderEnabled?: boolean;
  /** Días antes del pago para avisar (0 = solo el día). */
  reminderDaysBefore?: number;
  /** Última fecha en que se envió recordatorio (YYYY-MM-DD). */
  lastNotifiedKey?: string;
  createdAt: string;
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
  fixedExpenses: FixedExpense[];
  /** Recordatorios push del navegador para gastos fijos. */
  fixedExpenseNotificationsEnabled: boolean;
  /** Nombre del usuario para personalizar la app. */
  userName: string;
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
  fixedExpenses: [],
  fixedExpenseNotificationsEnabled: true,
  userName: "",
  onboardingDone: false,
};
