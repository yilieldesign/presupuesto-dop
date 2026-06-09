"use client";

import { useCallback, useEffect, useState } from "react";
import { applyCashOptimization } from "@/lib/debt/optimizer";
import type { OptimizationResult } from "@/lib/debt/optimizer";
import {
  addCategorySpent,
  distributeVitalReservation,
  expenseToVitalCategory,
  getWeekFundSpentTotal,
  getWeeklyFundTotal,
} from "@/lib/budget/vitalFund";
import {
  advancePaymentDate,
  dayOfMonthFromDateKey,
  getMonthKey,
} from "@/lib/budget/fixedExpenses";
import { normalizeUserName } from "@/lib/user/displayName";
import { syncWeekFund } from "@/lib/budget/week";
import { loadAppState, saveAppState } from "@/lib/storage/localStorage";
import { resetAppStorage } from "@/lib/storage/reset";
import { fetchUsdToDopRate } from "@/lib/currency/fetchExchangeRate";
import { useExchangeRateRefresh } from "@/hooks/useExchangeRateRefresh";
import {
  DEFAULT_APP_STATE,
  type AppState,
  type CashInjection,
  type Debt,
  type DebtStrategy,
  type ExpenseCategory,
  type FixedExpense,
  type Transaction,
  type VitalFundCategory,
  type SavingsDeposit,
  type SavingsGoalCategory,
  type WeeklyFundItem,
} from "@/types";

function createId(): string {
  return crypto.randomUUID();
}

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadAppState();
    const synced = { ...loaded, ...syncWeekFund(loaded) };
    setState(synced);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveAppState(state);
  }, [state, hydrated]);

  const update = useCallback((patch: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const addDebt = useCallback(
    (debt: Omit<Debt, "id" | "createdAt" | "originalBalance">) => {
      const newDebt: Debt = {
        ...debt,
        id: createId(),
        originalBalance: debt.balance,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, debts: [...prev.debts, newDebt] }));
    },
    []
  );

  const removeDebt = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
  }, []);

  const setStrategy = useCallback((strategy: DebtStrategy) => {
    update({ debtStrategy: strategy });
  }, [update]);

  const setWeeklyFundItems = useCallback((items: WeeklyFundItem[]) => {
    update({ weeklyFundItems: items });
  }, [update]);

  const applyAutoExchangeRate = useCallback((rate: number, fetchedAt: string) => {
    setState((prev) => {
      if (!prev.exchangeRateAuto) return prev;
      return {
        ...prev,
        exchangeRate: rate,
        exchangeRateUpdatedAt: fetchedAt,
      };
    });
  }, []);

  const setExchangeRateManual = useCallback((rate: number) => {
    update({
      exchangeRate: rate,
      exchangeRateAuto: false,
      exchangeRateUpdatedAt: new Date().toISOString(),
    });
  }, [update]);

  const enableAutoExchangeRate = useCallback(() => {
    update({ exchangeRateAuto: true });
  }, [update]);

  useExchangeRateRefresh({
    hydrated,
    exchangeRateAuto: state.exchangeRateAuto,
    exchangeRateUpdatedAt: state.exchangeRateUpdatedAt,
    onUpdate: applyAutoExchangeRate,
  });

  const refreshExchangeRate = useCallback(async () => {
    const result = await fetchUsdToDopRate();
    if (result) {
      update({
        exchangeRate: result.rate,
        exchangeRateUpdatedAt: result.fetchedAt,
      });
    }
  }, [update]);

  const addTransaction = useCallback(
    (tx: Omit<Transaction, "id" | "date"> & { date?: string }) => {
      const transaction: Transaction = {
        ...tx,
        id: createId(),
        date: tx.date ?? new Date().toISOString(),
      };

      setState((prev) => {
        const synced = syncWeekFund(prev);
        let weekFundCategorySpent = { ...synced.weekFundCategorySpent };
        const fundTotal = getWeeklyFundTotal(prev.weeklyFundItems);

        if (transaction.type === "expense" && fundTotal > 0) {
          const vitalCat = expenseToVitalCategory(transaction.category);
          if (vitalCat) {
            const itemCap = prev.weeklyFundItems
              .filter((i) => i.category === vitalCat)
              .reduce((s, i) => s + i.amount, 0);
            if (itemCap > 0) {
              weekFundCategorySpent = addCategorySpent(
                weekFundCategorySpent,
                vitalCat,
                transaction.amount,
                itemCap
              );
            }
          }
        }

        return {
          ...prev,
          ...synced,
          weekFundCategorySpent,
          transactions: [transaction, ...prev.transactions],
        };
      });
    },
    []
  );

  const completeOnboarding = useCallback((userName: string) => {
    update({
      userName: normalizeUserName(userName),
      onboardingDone: true,
    });
  }, [update]);

  const setUserName = useCallback((userName: string) => {
    update({ userName: normalizeUserName(userName) });
  }, [update]);

  const resetApp = useCallback(() => {
    resetAppStorage();
    setState({ ...DEFAULT_APP_STATE });
  }, []);

  const addSavingsGoal = useCallback(
    (goal: {
      name: string;
      category: SavingsGoalCategory;
      targetAmount: number;
    }) => {
      setState((prev) => ({
        ...prev,
        savingsGoals: [
          ...prev.savingsGoals,
          {
            id: createId(),
            name: goal.name,
            category: goal.category,
            targetAmount: goal.targetAmount,
            balance: 0,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    },
    []
  );

  const removeSavingsGoal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== id),
      savingsDeposits: prev.savingsDeposits.filter((d) => d.goalId !== id),
    }));
  }, []);

  const addFixedExpense = useCallback(
    (expense: {
      name: string;
      amount: number;
      category: ExpenseCategory;
      nextPaymentDate: string;
      reminderEnabled?: boolean;
      reminderDaysBefore?: number;
    }) => {
      const dayOfMonth = dayOfMonthFromDateKey(expense.nextPaymentDate);
      const item: FixedExpense = {
        id: createId(),
        name: expense.name,
        amount: expense.amount,
        category: expense.category,
        nextPaymentDate: expense.nextPaymentDate,
        dayOfMonth,
        reminderEnabled: expense.reminderEnabled !== false,
        reminderDaysBefore: expense.reminderDaysBefore ?? 1,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        fixedExpenses: [...prev.fixedExpenses, item],
      }));
    },
    []
  );

  const updateFixedExpense = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          FixedExpense,
          | "nextPaymentDate"
          | "reminderEnabled"
          | "reminderDaysBefore"
          | "amount"
          | "name"
        >
      >
    ) => {
      setState((prev) => ({
        ...prev,
        fixedExpenses: prev.fixedExpenses.map((e) => {
          if (e.id !== id) return e;
          const nextPaymentDate = patch.nextPaymentDate ?? e.nextPaymentDate;
          return {
            ...e,
            ...patch,
            nextPaymentDate,
            dayOfMonth: patch.nextPaymentDate
              ? dayOfMonthFromDateKey(nextPaymentDate)
              : e.dayOfMonth,
            lastNotifiedKey: patch.nextPaymentDate ? undefined : e.lastNotifiedKey,
          };
        }),
      }));
    },
    []
  );

  const markFixedExpenseNotified = useCallback(
    (id: string, notifyKey: string) => {
      setState((prev) => ({
        ...prev,
        fixedExpenses: prev.fixedExpenses.map((e) =>
          e.id === id ? { ...e, lastNotifiedKey: notifyKey } : e
        ),
      }));
    },
    []
  );

  const setFixedExpenseNotificationsEnabled = useCallback((enabled: boolean) => {
    update({ fixedExpenseNotificationsEnabled: enabled });
  }, [update]);

  const removeFixedExpense = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((e) => e.id !== id),
    }));
  }, []);

  const markFixedExpensePaid = useCallback(
    (id: string) => {
      setState((prev) => {
        const expense = prev.fixedExpenses.find((e) => e.id === id);
        if (!expense) return prev;

        const monthKey = getMonthKey();
        if (expense.lastPaidMonthKey === monthKey) return prev;

        const synced = syncWeekFund(prev);
        let weekFundCategorySpent = { ...synced.weekFundCategorySpent };
        const fundTotal = getWeeklyFundTotal(prev.weeklyFundItems);

        if (fundTotal > 0) {
          const vitalCat = expenseToVitalCategory(expense.category);
          if (vitalCat) {
            const itemCap = prev.weeklyFundItems
              .filter((i) => i.category === vitalCat)
              .reduce((s, i) => s + i.amount, 0);
            if (itemCap > 0) {
              weekFundCategorySpent = addCategorySpent(
                weekFundCategorySpent,
                vitalCat,
                expense.amount,
                itemCap
              );
            }
          }
        }

        const transaction: Transaction = {
          id: createId(),
          type: "expense",
          amount: expense.amount,
          category: expense.category,
          description: `${expense.name} (gasto fijo)`,
          date: new Date().toISOString(),
        };

        const nextPaymentDate = advancePaymentDate(
          expense.nextPaymentDate,
          expense.dayOfMonth
        );

        return {
          ...prev,
          ...synced,
          weekFundCategorySpent,
          fixedExpenses: prev.fixedExpenses.map((e) =>
            e.id === id
              ? {
                  ...e,
                  lastPaidMonthKey: monthKey,
                  nextPaymentDate,
                  lastNotifiedKey: undefined,
                }
              : e
          ),
          transactions: [transaction, ...prev.transactions],
        };
      });
    },
    []
  );

  const addSavingsDeposit = useCallback(
    (goalId: string, amount: number, note?: string) => {
      if (amount <= 0) return;

      setState((prev) => {
        const goal = prev.savingsGoals.find((g) => g.id === goalId);
        if (!goal) return prev;

        const deposit: SavingsDeposit = {
          id: createId(),
          goalId,
          goalName: goal.name,
          amount,
          date: new Date().toISOString(),
          note,
        };

        return {
          ...prev,
          savingsGoals: prev.savingsGoals.map((g) =>
            g.id === goalId
              ? { ...g, balance: Math.round((g.balance + amount) * 100) / 100 }
              : g
          ),
          savingsDeposits: [deposit, ...prev.savingsDeposits],
        };
      });
    },
    []
  );

  const applyOptimization = useCallback(
    (result: OptimizationResult, description?: string) => {
      if (result.totalAllocated <= 0 && result.vitalFundReserved <= 0) return;

      setState((prev) => {
        const synced = syncWeekFund(prev);
        const debtInputs = prev.debts.map((d) => ({
          id: d.id,
          name: d.name,
          currency: d.currency,
          balance: d.balance,
          interestRate: d.interestRate,
          minimumPayment: d.minimumPayment,
        }));

        const updatedDebts = applyCashOptimization(
          debtInputs,
          result.allocations
        );

        const injection: CashInjection = {
          id: createId(),
          amount: result.cashAmount,
          date: new Date().toISOString(),
          strategy: result.strategy,
          totalToDebts: result.totalAllocated,
          vitalFundReserved: result.vitalFundReserved,
          allocations: result.allocations.map((a) => ({
            debtId: a.debtId,
            debtName: a.debtName,
            type: a.type,
            currency: a.currency,
            amount: a.amount,
            amountDOP: a.amountDOP,
          })),
        };

        const newTransactions: Transaction[] = [
          {
            id: createId(),
            type: "income",
            amount: result.cashAmount,
            description: description ?? "Cobro del día",
            date: new Date().toISOString(),
          },
        ];

        if (result.vitalFundReserved > 0) {
          newTransactions.unshift({
            id: createId(),
            type: "expense",
            amount: result.vitalFundReserved,
            category: "comida",
            description: "Reserva fondo vital (optimizador)",
            date: new Date().toISOString(),
          });
        }

        if (result.totalAllocated > 0) {
          newTransactions.unshift({
            id: createId(),
            type: "debt_payment",
            amount: result.totalAllocated,
            description: `Inyección optimizada → ${result.priorityDebtName ?? "deudas"}`,
            date: new Date().toISOString(),
          });
        }

        const fundTotal = getWeeklyFundTotal(prev.weeklyFundItems);
        let weekFundCategorySpent = { ...synced.weekFundCategorySpent };

        if (result.vitalFundReserved > 0 && fundTotal > 0) {
          const distribution = distributeVitalReservation(
            prev.weeklyFundItems,
            result.vitalFundReserved
          );
          for (const [cat, amt] of Object.entries(distribution)) {
            const vitalCat = cat as VitalFundCategory;
            const itemCap = prev.weeklyFundItems
              .filter((i) => i.category === vitalCat)
              .reduce((s, i) => s + i.amount, 0);
            weekFundCategorySpent = addCategorySpent(
              weekFundCategorySpent,
              vitalCat,
              amt ?? 0,
              itemCap
            );
          }
        }

        const totalSpent = getWeekFundSpentTotal(weekFundCategorySpent);
        if (totalSpent > fundTotal) {
          const scale = fundTotal / totalSpent;
          weekFundCategorySpent = Object.fromEntries(
            Object.entries(weekFundCategorySpent).map(([k, v]) => [
              k,
              Math.round((v ?? 0) * scale * 100) / 100,
            ])
          ) as typeof weekFundCategorySpent;
        }

        return {
          ...prev,
          ...synced,
          weekFundCategorySpent,
          debts: prev.debts.map((d) => {
            const updated = updatedDebts.find((u) => u.id === d.id);
            return updated ? { ...d, balance: updated.balance } : d;
          }),
          injections: [injection, ...prev.injections],
          transactions: [...newTransactions, ...prev.transactions],
        };
      });
    },
    []
  );

  return {
    state,
    hydrated,
    addDebt,
    removeDebt,
    setStrategy,
    setWeeklyFundItems,
    setExchangeRateManual,
    enableAutoExchangeRate,
    refreshExchangeRate,
    addTransaction,
    applyOptimization,
    addSavingsGoal,
    removeSavingsGoal,
    addSavingsDeposit,
    addFixedExpense,
    updateFixedExpense,
    removeFixedExpense,
    markFixedExpensePaid,
    markFixedExpenseNotified,
    setFixedExpenseNotificationsEnabled,
    completeOnboarding,
    setUserName,
    resetApp,
    update,
  };
}
