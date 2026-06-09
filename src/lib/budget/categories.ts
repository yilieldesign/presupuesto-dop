import type { ExpenseCategory } from "@/types";

export const EXPENSE_CATEGORIES: {
  id: ExpenseCategory;
  label: string;
  icon: string;
}[] = [
  { id: "vivienda", label: "Vivienda", icon: "Home" },
  { id: "comida", label: "Comida", icon: "UtensilsCrossed" },
  { id: "combustible", label: "Combustible", icon: "Fuel" },
  { id: "transporte", label: "Transporte", icon: "Car" },
  { id: "salud", label: "Salud", icon: "HeartPulse" },
  { id: "entretenimiento", label: "Entretenimiento", icon: "Gamepad2" },
  { id: "educacion", label: "Educación", icon: "GraduationCap" },
  { id: "servicios", label: "Servicios", icon: "Zap" },
  { id: "herramientas", label: "Herramientas", icon: "Wrench" },
  { id: "otros", label: "Otros", icon: "MoreHorizontal" },
];
