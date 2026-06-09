"use client";

import {
  getWeekFundSpentTotal,
  getWeeklyFundTotal,
} from "@/lib/budget/vitalFund";
import type { OptimizationResult } from "@/lib/debt/optimizer";
import type { AppState, Currency, Debt, DebtStrategy } from "@/types";
import { DebtPaymentAlerts } from "./DebtPaymentAlerts";
import { Card } from "@/components/ui/Card";
import { CashOptimizer } from "./CashOptimizer";
import { DebtForm } from "./DebtForm";
import { DebtList } from "./DebtList";
import { ExchangeRateCard } from "./ExchangeRateCard";
import { StrategySelector } from "./StrategySelector";

interface DebtsViewProps {
  state: AppState;
  onAddDebt: (debt: {
    name: string;
    currency: Currency;
    balance: number;
    interestRate: number;
    minimumPayment: number;
    paymentPriority: Debt["paymentPriority"];
    nextPaymentDate?: string;
  }) => void;
  onUpdateDebt: (
    id: string,
    patch: Partial<
      Pick<Debt, "nextPaymentDate" | "paymentPriority" | "minimumPayment">
    >
  ) => void;
  onMarkDebtMinimumPaid: (id: string) => void;
  onRemoveDebt: (id: string) => void;
  onStrategyChange: (strategy: DebtStrategy) => void;
  onExchangeRateManual: (rate: number) => void;
  onExchangeRateAuto: () => void;
  onRefreshExchangeRate: () => void | Promise<void>;
  onApplyOptimization: (result: OptimizationResult) => void;
}

export function DebtsView({
  state,
  onAddDebt,
  onUpdateDebt,
  onMarkDebtMinimumPaid,
  onRemoveDebt,
  onStrategyChange,
  onExchangeRateManual,
  onExchangeRateAuto,
  onRefreshExchangeRate,
  onApplyOptimization,
}: DebtsViewProps) {
  const hasUsdDebt = state.debts.some((d) => d.currency === "USD");

  return (
    <div className="space-y-5 pb-4">
      <DebtPaymentAlerts
        debts={state.debts}
        exchangeRate={state.exchangeRate}
        onMarkMinimumPaid={onMarkDebtMinimumPaid}
      />

      <CashOptimizer
        debts={state.debts}
        strategy={state.debtStrategy}
        exchangeRate={state.exchangeRate}
        weeklyFixedFund={getWeeklyFundTotal(state.weeklyFundItems)}
        weekFundSpent={getWeekFundSpentTotal(state.weekFundCategorySpent)}
        onApply={onApplyOptimization}
      />

      {(hasUsdDebt || state.debts.length === 0) && (
        <ExchangeRateCard
          exchangeRate={state.exchangeRate}
          exchangeRateUpdatedAt={state.exchangeRateUpdatedAt}
          exchangeRateAuto={state.exchangeRateAuto}
          onSaveManual={onExchangeRateManual}
          onEnableAuto={onExchangeRateAuto}
          onRefresh={onRefreshExchangeRate}
        />
      )}

      <Card>
        <h3 className="mb-3 text-sm font-semibold">Estrategia activa</h3>
        <StrategySelector
          value={state.debtStrategy}
          onChange={onStrategyChange}
        />
      </Card>

      <DebtList
        debts={state.debts}
        exchangeRate={state.exchangeRate}
        onRemove={onRemoveDebt}
        onUpdate={onUpdateDebt}
        onMarkMinimumPaid={onMarkDebtMinimumPaid}
      />
      <DebtForm exchangeRate={state.exchangeRate} onAdd={onAddDebt} />
    </div>
  );
}
