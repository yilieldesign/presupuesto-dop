import { DEFAULT_APP_STATE } from "@/types";
import { STORAGE_KEYS } from "./keys";

/** Borra todos los datos locales y deja la app en estado de fábrica. */
export function resetAppStorage(): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(STORAGE_KEYS.APP_STATE);
  window.localStorage.removeItem(STORAGE_KEYS.LEGACY_APP_STATE);
}

export function isAppEmpty(state: typeof DEFAULT_APP_STATE): boolean {
  return (
    state.debts.length === 0 &&
    state.transactions.length === 0 &&
    state.injections.length === 0 &&
    state.weeklyFundItems.length === 0 &&
    state.savingsGoals.length === 0 &&
    state.fixedExpenses.length === 0
  );
}
