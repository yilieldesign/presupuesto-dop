import { describe, expect, it } from "vitest";
import {
  advancePaymentDate,
  daysUntilDue,
  getEffectiveDay,
  getFixedExpenseStatus,
  getMonthKey,
  getRemindersForToday,
  getUrgentFixedExpenseCommitments,
  isPaidThisMonth,
  toDateKey,
} from "./fixedExpenses";
import type { FixedExpense } from "@/types";

const base: FixedExpense = {
  id: "1",
  name: "Alquiler",
  amount: 15000,
  category: "vivienda",
  dayOfMonth: 5,
  nextPaymentDate: "2026-06-05",
  reminderEnabled: true,
  reminderDaysBefore: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("fixedExpenses", () => {
  it("ajusta día 31 en febrero", () => {
    expect(getEffectiveDay(2026, 1, 31)).toBe(28);
  });

  it("detecta vencido si pasó la fecha y no está pagado", () => {
    const now = new Date(2026, 5, 8);
    expect(
      getFixedExpenseStatus({ ...base, nextPaymentDate: "2026-06-05" }, now)
    ).toBe("due");
  });

  it("detecta próximo si aún no llega la fecha", () => {
    const now = new Date(2026, 5, 3);
    expect(
      getFixedExpenseStatus({ ...base, nextPaymentDate: "2026-06-05" }, now)
    ).toBe("upcoming");
    expect(daysUntilDue({ ...base, nextPaymentDate: "2026-06-05" }, now)).toBe(
      2
    );
  });

  it("marca pagado si lastPaidMonthKey coincide", () => {
    const now = new Date(2026, 5, 10);
    const key = getMonthKey(now);
    expect(isPaidThisMonth({ ...base, lastPaidMonthKey: key }, key)).toBe(
      true
    );
    expect(
      getFixedExpenseStatus({ ...base, lastPaidMonthKey: key }, now)
    ).toBe("paid");
  });

  it("avanza la fecha al siguiente mes", () => {
    expect(advancePaymentDate("2026-06-05", 5)).toBe("2026-07-05");
  });

  it("envía recordatorio el día previo configurado", () => {
    const now = new Date(2026, 5, 4);
    const reminders = getRemindersForToday(
      [{ ...base, nextPaymentDate: "2026-06-05", reminderDaysBefore: 1 }],
      true,
      now
    );
    expect(reminders).toHaveLength(1);
    expect(reminders[0].kind).toBe("due_soon");
    expect(reminders[0].notifyKey).toBe(toDateKey(now));
  });

  it("envía recordatorio el día del pago", () => {
    const now = new Date(2026, 5, 5);
    const reminders = getRemindersForToday(
      [{ ...base, nextPaymentDate: "2026-06-05", reminderDaysBefore: 0 }],
      true,
      now
    );
    expect(reminders).toHaveLength(1);
    expect(reminders[0].kind).toBe("due_today");
  });

  it("lista gastos fijos urgentes vencidos o en 7 días", () => {
    const now = new Date(2026, 5, 8);
    const urgent = getUrgentFixedExpenseCommitments(
      [
        { ...base, nextPaymentDate: "2026-06-05" },
        { ...base, id: "2", name: "Internet", nextPaymentDate: "2026-06-20" },
      ],
      now
    );
    expect(urgent).toHaveLength(1);
    expect(urgent[0].name).toBe("Alquiler");
  });
});
