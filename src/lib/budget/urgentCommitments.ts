import {
  daysUntilDue,
  getFixedExpenseStatus,
  getUrgentFixedExpenseCommitments,
} from "@/lib/budget/fixedExpenses";
import {
  daysUntilDebtDue,
  getDebtDueStatus,
  getUrgentDebtCommitments,
  isScheduledDebt,
  type SchedulableDebt,
} from "@/lib/debt/debtSchedule";
import type { FixedExpense } from "@/types";
import type { DebtInput } from "@/lib/debt/types";

export type CommitmentSource = "fixed_expense" | "debt";

export interface UrgentCommitment {
  source: CommitmentSource;
  id: string;
  name: string;
  amountDOP: number;
  statusOrder: number;
  daysUntil: number;
  debt?: {
    currency: DebtInput["currency"];
    minimumPayment: number;
    balance: number;
  };
  fixedExpense?: FixedExpense;
}

function commitmentStatusOrder(
  status: "due" | "upcoming" | "paid" | "flexible"
): number {
  const order = { due: 0, upcoming: 1, paid: 2, flexible: 3 };
  return order[status];
}

/** Une gastos fijos y deudas urgentes, ordenados por fecha (vencidos primero). */
export function mergeUrgentCommitments(
  fixedExpenses: FixedExpense[],
  debts: DebtInput[],
  scheduleById: Map<string, SchedulableDebt>,
  exchangeRate: number,
  now: Date = new Date(),
  urgentWithinDays = 7
): UrgentCommitment[] {
  const items: UrgentCommitment[] = [];

  for (const expense of getUrgentFixedExpenseCommitments(
    fixedExpenses,
    now,
    urgentWithinDays
  )) {
    const status = getFixedExpenseStatus(expense, now);
    items.push({
      source: "fixed_expense",
      id: expense.id,
      name: expense.name,
      amountDOP: expense.amount,
      statusOrder: commitmentStatusOrder(status),
      daysUntil: daysUntilDue(expense, now),
      fixedExpense: expense,
    });
  }

  for (const debt of getUrgentDebtCommitments(
    debts,
    scheduleById,
    exchangeRate,
    now,
    urgentWithinDays
  )) {
    const meta = scheduleById.get(debt.id);
    const status = meta ? getDebtDueStatus(meta, now) : "flexible";
    items.push({
      source: "debt",
      id: debt.id,
      name: debt.name,
      amountDOP: debt.monthlyMinimumDOP,
      statusOrder: commitmentStatusOrder(status),
      daysUntil: meta && isScheduledDebt(meta) ? (daysUntilDebtDue(meta, now) ?? 99) : 99,
      debt: {
        currency: debt.currency,
        minimumPayment: debt.minimumPayment,
        balance: debt.balance,
      },
    });
  }

  return items.sort((a, b) => {
    if (a.statusOrder !== b.statusOrder) return a.statusOrder - b.statusOrder;
    return a.daysUntil - b.daysUntil;
  });
}
