import type { SavingsGoal } from "@/types";

export function getTotalSaved(goals: SavingsGoal[]): number {
  return goals.reduce((sum, g) => sum + g.balance, 0);
}

export function getTotalTarget(goals: SavingsGoal[]): number {
  return goals.reduce((sum, g) => sum + g.targetAmount, 0);
}

export function getGoalProgress(goal: SavingsGoal): number {
  if (goal.targetAmount <= 0) return goal.balance > 0 ? 100 : 0;
  return Math.min(100, (goal.balance / goal.targetAmount) * 100);
}

export function getMotivationMessage(debtProgress: number): {
  title: string;
  subtitle: string;
  tone: "hope" | "ready" | "celebrate";
} {
  if (debtProgress >= 75) {
    return {
      title: "¡Las cosas están mejorando!",
      subtitle:
        "Ya eliminaste gran parte de tus deudas. Es momento de construir tu futuro.",
      tone: "celebrate",
    };
  }
  if (debtProgress >= 40) {
    return {
      title: "Vas por buen camino",
      subtitle:
        "Cada depósito aquí es prueba de que la estrategia está funcionando.",
      tone: "ready",
    };
  }
  if (debtProgress > 0) {
    return {
      title: "La recuperación empezó",
      subtitle:
        "Aunque aún hay deudas, ya puedes apartar algo simbólico para no rendirte.",
      tone: "hope",
    };
  }
  return {
    title: "Planta la semilla hoy",
    subtitle:
      "Define tus metas ahora. Cuando los cobros mejoren, ya sabrás a dónde ir.",
    tone: "hope",
  };
}
