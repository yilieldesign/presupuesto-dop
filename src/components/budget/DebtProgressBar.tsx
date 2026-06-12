"use client";

import { formatDOP, formatUSD } from "@/lib/currency/format";
import {
  getDebtPaydownProgress,
  getOriginalDebtTotal,
  getTotalDebtBalance,
  getTotalInjectedToDebts,
  getDebtsByCurrency,
} from "@/lib/budget/stats";
import type { AppState } from "@/types";
import { Card } from "@/components/ui/Card";
import { Zap } from "lucide-react";

interface DebtProgressBarProps {
  state: AppState;
}

export function DebtProgressBar({ state }: DebtProgressBarProps) {
  const { exchangeRate } = state;
  const progress = getDebtPaydownProgress(state.debts, exchangeRate);
  const current = getTotalDebtBalance(state.debts, exchangeRate);
  const original = getOriginalDebtTotal(state.debts, exchangeRate);
  const injected = getTotalInjectedToDebts(state.injections);
  const { dop, usd } = getDebtsByCurrency(state.debts);

  if (state.debts.length === 0) return null;

  const eliminated = original - current;
  const usdBalance = usd.reduce((s, d) => s + d.balance, 0);
  const dopBalance = dop.reduce((s, d) => s + d.balance, 0);

  return (
    <Card className="overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-[var(--ios-green)]" />
          <h3 className="text-sm font-semibold">Progreso de deudas</h3>
        </div>
        <span className="text-sm font-bold text-[var(--ios-green)]">
          {progress.toFixed(1)}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-[var(--ios-bg)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--ios-tint)] to-[var(--ios-green)] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[var(--ios-muted)]">Eliminado</p>
          <p className="font-semibold text-[var(--ios-green)]">
            {formatDOP(eliminated)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[var(--ios-muted)]">Pendiente (total)</p>
          <p className="font-semibold">{formatDOP(current)}</p>
        </div>
      </div>

      {(dop.length > 0 || usd.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[var(--ios-muted)]">
          {dop.length > 0 && (
            <span>RD$: {formatDOP(dopBalance)}</span>
          )}
          {usd.length > 0 && (
            <span>
              US$: {formatUSD(usdBalance)} (≈{" "}
              {formatDOP(usdBalance * exchangeRate)})
            </span>
          )}
        </div>
      )}

      {injected > 0 && (
        <p className="mt-2 text-xs text-[var(--ios-muted)]">
          {formatDOP(injected)} inyectados con el Optimizador de Menudeo
        </p>
      )}
    </Card>
  );
}
