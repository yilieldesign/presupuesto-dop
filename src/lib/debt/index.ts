export { simulateDebtPayoff, compareStrategies } from "./engine";
export {
  optimizeCashInjection,
  applyCashOptimization,
} from "./optimizer";
export {
  sortDebtsByStrategy,
  annualToMonthlyRate,
  isDebtActive,
} from "./strategies";
export { roundMoney, WEEKS_PER_MONTH } from "./utils";
export type {
  DebtInput,
  SimDebt,
  SimulationOptions,
  SimulationResult,
  MonthlyScheduleEntry,
  DebtPaymentDetail,
} from "./types";
export type {
  OptimizeCashOptions,
  OptimizationResult,
  CashAllocation,
  AllocationType,
} from "./optimizer";
