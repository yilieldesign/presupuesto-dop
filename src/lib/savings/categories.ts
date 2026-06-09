import type { SavingsGoalCategory } from "@/types";

export const SAVINGS_CATEGORIES: {
  id: SavingsGoalCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "emergency",
    label: "Emergencia",
    description: "Colchón para imprevistos",
  },
  {
    id: "equipment",
    label: "Equipo",
    description: "Cámara, lentes, herramientas AV",
  },
  {
    id: "buffer",
    label: "Colchón",
    description: "1–2 meses sin trabajar",
  },
  {
    id: "personal",
    label: "Personal",
    description: "Meta tuya cuando todo mejore",
  },
  {
    id: "other",
    label: "Otro",
    description: "Lo que tú definas",
  },
];

export const SAVINGS_PRESETS: {
  category: SavingsGoalCategory;
  name: string;
  suggestedTarget: number;
}[] = [
  { category: "emergency", name: "Fondo de emergencia", suggestedTarget: 15000 },
  { category: "equipment", name: "Nuevo equipo AV", suggestedTarget: 50000 },
  { category: "buffer", name: "Colchón del mes", suggestedTarget: 20000 },
  { category: "personal", name: "Mi meta personal", suggestedTarget: 10000 },
];
