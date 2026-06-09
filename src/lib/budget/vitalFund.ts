import type { ExpenseCategory, VitalFundCategory, WeeklyFundItem } from "@/types";

export const VITAL_FUND_CATEGORIES: {
  id: VitalFundCategory;
  label: string;
}[] = [
  { id: "comida", label: "Comida" },
  { id: "combustible", label: "Combustible" },
  { id: "transporte", label: "Transporte" },
  { id: "herramientas", label: "Herramientas" },
  { id: "servicios", label: "Servicios" },
  { id: "otros", label: "Otros" },
];

const EXPENSE_TO_VITAL: Partial<Record<ExpenseCategory, VitalFundCategory>> = {
  comida: "comida",
  combustible: "combustible",
  transporte: "transporte",
  herramientas: "herramientas",
  servicios: "servicios",
  otros: "otros",
};

export function expenseToVitalCategory(
  category?: ExpenseCategory
): VitalFundCategory | null {
  if (!category) return null;
  return EXPENSE_TO_VITAL[category] ?? null;
}

export function getWeeklyFundTotal(items: WeeklyFundItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function getCategorySpent(
  categorySpent: Partial<Record<VitalFundCategory, number>>,
  category: VitalFundCategory
): number {
  return categorySpent[category] ?? 0;
}

export function getWeekFundSpentTotal(
  categorySpent: Partial<Record<VitalFundCategory, number>>
): number {
  return Object.values(categorySpent).reduce(
    (sum, v) => sum + (v ?? 0),
    0
  );
}

export function getVitalFundLabel(category: VitalFundCategory): string {
  return (
    VITAL_FUND_CATEGORIES.find((c) => c.id === category)?.label ?? category
  );
}

export function addCategorySpent(
  current: Partial<Record<VitalFundCategory, number>>,
  category: VitalFundCategory,
  amount: number,
  cap?: number
): Partial<Record<VitalFundCategory, number>> {
  const next = { ...current };
  const newVal = (next[category] ?? 0) + amount;
  next[category] = cap !== undefined ? Math.min(cap, newVal) : newVal;
  return next;
}

export function removeCategorySpent(
  current: Partial<Record<VitalFundCategory, number>>,
  category: VitalFundCategory,
  amount: number
): Partial<Record<VitalFundCategory, number>> {
  const next = { ...current };
  const newVal = Math.max(0, (next[category] ?? 0) - amount);
  if (newVal <= 0) {
    delete next[category];
  } else {
    next[category] = newVal;
  }
  return next;
}

export function adjustExpenseVitalFund(
  categorySpent: Partial<Record<VitalFundCategory, number>>,
  items: WeeklyFundItem[],
  category: ExpenseCategory | undefined,
  amountDelta: number
): Partial<Record<VitalFundCategory, number>> {
  const vitalCat = expenseToVitalCategory(category);
  if (!vitalCat || amountDelta === 0) return categorySpent;

  const itemCap = items
    .filter((i) => i.category === vitalCat)
    .reduce((s, i) => s + i.amount, 0);
  if (itemCap <= 0) return categorySpent;

  if (amountDelta > 0) {
    return addCategorySpent(categorySpent, vitalCat, amountDelta, itemCap);
  }
  return removeCategorySpent(categorySpent, vitalCat, Math.abs(amountDelta));
}

/** Reparte una reserva del optimizador entre rubros proporcionalmente. */
export function distributeVitalReservation(
  items: WeeklyFundItem[],
  amount: number
): Partial<Record<VitalFundCategory, number>> {
  const total = getWeeklyFundTotal(items);
  if (total <= 0 || amount <= 0) return {};

  const result: Partial<Record<VitalFundCategory, number>> = {};

  for (const item of items) {
    const share = (item.amount / total) * amount;
    result[item.category] = Math.round(
      ((result[item.category] ?? 0) + share) * 100
    ) / 100;
  }

  return result;
}
