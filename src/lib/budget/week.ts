import type { VitalFundCategory } from "@/types";

/** Clave ISO de semana (año + número de semana) para reiniciar el fondo semanal. */
export function getCurrentWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function syncWeekFund(state: {
  weekFundWeekKey: string;
  weekFundCategorySpent: Partial<Record<VitalFundCategory, number>>;
}): {
  weekFundWeekKey: string;
  weekFundCategorySpent: Partial<Record<VitalFundCategory, number>>;
} {
  const current = getCurrentWeekKey();
  if (state.weekFundWeekKey !== current) {
    return { weekFundWeekKey: current, weekFundCategorySpent: {} };
  }
  return state;
}
