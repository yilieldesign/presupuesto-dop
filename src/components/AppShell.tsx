"use client";

import { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import { useFixedExpenseNotifications } from "@/hooks/useFixedExpenseNotifications";
import type { TabId } from "@/types";
import { TabBar } from "@/components/layout/TabBar";
import { BudgetView } from "@/components/budget/BudgetView";
import { DebtsView } from "@/components/debts/DebtsView";
import { ProgressView } from "@/components/progress/ProgressView";
import { FixedExpensesView } from "@/components/fixed/FixedExpensesView";
import { SavingsView } from "@/components/savings/SavingsView";
import { WelcomeScreen } from "@/components/onboarding/WelcomeScreen";
import { getPersonalGreeting } from "@/lib/user/displayName";

const titles: Record<TabId, string> = {
  budget: "Presupuesto",
  fixed: "Gastos fijos",
  debts: "Deudas",
  savings: "Ahorro",
  progress: "Progreso",
};

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("budget");
  const {
    state,
    hydrated,
    addDebt,
    updateDebt,
    markDebtNotified,
    markDebtMinimumPaid,
    removeDebt,
    setStrategy,
    setWeeklyFundItems,
    setExchangeRateManual,
    enableAutoExchangeRate,
    refreshExchangeRate,
    addTransaction,
    updateTransaction,
    removeTransaction,
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
  } = useAppState();

  const { permission: notificationPermission, enableNotifications } =
    useFixedExpenseNotifications({
      hydrated,
      expenses: state.fixedExpenses,
      debts: state.debts,
      notificationsEnabled: state.fixedExpenseNotificationsEnabled,
      onExpenseNotified: markFixedExpenseNotified,
      onDebtNotified: markDebtNotified,
    });

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--ios-tint)] border-t-transparent" />
      </div>
    );
  }

  const handleStart = (userName: string) => {
    completeOnboarding(userName);
    setActiveTab("budget");
  };

  const greeting = getPersonalGreeting(state.userName);

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-[var(--ios-bg)]">
      {!state.onboardingDone && <WelcomeScreen onStart={handleStart} />}

      <header
        className="sticky top-0 z-30 border-b border-[var(--ios-separator)] bg-[var(--ios-bg)]/90 backdrop-blur-xl"
        style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
      >
        <div className="px-4 pb-3 pt-2">
          <p className="text-xs font-medium text-[var(--ios-muted)]">
            {greeting || "Presupuesto DOP"}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {titles[activeTab]}
          </h1>
        </div>
      </header>

      <main
        className="px-4 pt-4"
        style={{
          paddingBottom:
            "calc(88px + max(8px, env(safe-area-inset-bottom)))",
        }}
      >
        {activeTab === "budget" && (
          <BudgetView
            state={state}
            onSetWeeklyFundItems={setWeeklyFundItems}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
            onRemoveTransaction={removeTransaction}
            onResetApp={resetApp}
            onSetUserName={setUserName}
            onOpenFixedTab={() => setActiveTab("fixed")}
          />
        )}
        {activeTab === "fixed" && (
          <FixedExpensesView
            expenses={state.fixedExpenses}
            notificationsEnabled={state.fixedExpenseNotificationsEnabled}
            notificationPermission={notificationPermission}
            onAdd={addFixedExpense}
            onUpdate={updateFixedExpense}
            onRemove={removeFixedExpense}
            onMarkPaid={markFixedExpensePaid}
            onEnableNotifications={enableNotifications}
            onSetNotificationsEnabled={setFixedExpenseNotificationsEnabled}
          />
        )}
        {activeTab === "debts" && (
          <DebtsView
            state={state}
            onAddDebt={addDebt}
            onUpdateDebt={updateDebt}
            onMarkDebtMinimumPaid={markDebtMinimumPaid}
            onRemoveDebt={removeDebt}
            onStrategyChange={setStrategy}
            onExchangeRateManual={setExchangeRateManual}
            onExchangeRateAuto={enableAutoExchangeRate}
            onRefreshExchangeRate={refreshExchangeRate}
            onApplyOptimization={applyOptimization}
          />
        )}
        {activeTab === "savings" && (
          <SavingsView
            state={state}
            onAddGoal={addSavingsGoal}
            onRemoveGoal={removeSavingsGoal}
            onDeposit={addSavingsDeposit}
          />
        )}
        {activeTab === "progress" && <ProgressView state={state} />}
      </main>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
