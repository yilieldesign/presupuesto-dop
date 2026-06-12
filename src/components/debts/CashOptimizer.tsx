"use client";

import { useMemo, useState } from "react";
import { Zap, CheckCircle2 } from "lucide-react";
import {
  adjustOptimizationResult,
  optimizeCashInjection,
} from "@/lib/debt/optimizer";
import type { OptimizationResult } from "@/lib/debt/optimizer";
import { parseDOPInput } from "@/lib/currency/format";
import type { Debt, DebtStrategy, FixedExpense } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { OptimizationReceipt } from "./OptimizationReceipt";

interface CashOptimizerProps {
  debts: Debt[];
  fixedExpenses: FixedExpense[];
  strategy: DebtStrategy;
  exchangeRate: number;
  weeklyFixedFund: number;
  weekFundSpent: number;
  onApply: (result: OptimizationResult) => void;
}

export function CashOptimizer({
  debts,
  fixedExpenses,
  strategy,
  exchangeRate,
  weeklyFixedFund,
  weekFundSpent,
  onApply,
}: CashOptimizerProps) {
  const [cashInput, setCashInput] = useState("");
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [excludedLines, setExcludedLines] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState(false);

  const activeDebts = debts.filter((d) => d.balance > 0);
  const cashAmount = parseDOPInput(cashInput);

  const adjustedResult = useMemo(
    () =>
      result ? adjustOptimizationResult(result, excludedLines) : null,
    [result, excludedLines]
  );

  const handleOptimize = () => {
    if (cashAmount <= 0) return;
    if (activeDebts.length === 0 && fixedExpenses.length === 0) return;

    const optimized = optimizeCashInjection({
      cashAmount,
      debts: activeDebts.map((d) => ({
        id: d.id,
        name: d.name,
        currency: d.currency,
        balance: d.balance,
        interestRate: d.interestRate,
        minimumPayment: d.minimumPayment,
      })),
      fixedExpenses,
      strategy,
      exchangeRate,
      weeklyFixedFund,
      weekFundSpent,
      debtSchedule: activeDebts,
    });

    setResult(optimized);
    setExcludedLines(new Set());
    setApplied(false);
  };

  const handleRemoveLine = (lineKey: string) => {
    setExcludedLines((prev) => new Set([...prev, lineKey]));
    setApplied(false);
  };

  const handleRestoreAll = () => {
    setExcludedLines(new Set());
    setApplied(false);
  };

  const handleApply = () => {
    if (!adjustedResult) return;
    onApply(adjustedResult);
    setApplied(true);
    setCashInput("");
    setResult(null);
    setExcludedLines(new Set());
  };

  if (activeDebts.length === 0 && fixedExpenses.length === 0) {
    return (
      <Card>
        <p className="text-center text-sm text-[var(--ios-muted)]">
          Registra deudas o gastos fijos para usar el Optimizador de Menudeo.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 border-[var(--ios-tint)]/20">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ios-tint)]/15">
            <Zap size={20} className="text-[var(--ios-tint)]" />
          </div>
          <div>
            <h2 className="text-base font-bold">Optimizador de Menudeo</h2>
            <p className="text-xs text-[var(--ios-muted)]">
              Fondo vital → gastos fijos y deudas con fecha → ataque a deudas.
              Ajusta lo que sí pagarás.
            </p>
          </div>
        </div>

        <MoneyInput
          value={cashInput}
          onChange={(v) => {
            setCashInput(v);
            setApplied(false);
          }}
          placeholder="7,500"
          size="lg"
        />

        <Button
          fullWidth
          size="lg"
          className="mt-4"
          onClick={handleOptimize}
          disabled={cashAmount <= 0}
        >
          Optimizar este dinero
        </Button>
      </Card>

      {adjustedResult && (
        <>
          <OptimizationReceipt
            result={adjustedResult}
            hasExcludedLines={excludedLines.size > 0}
            onRemoveLine={handleRemoveLine}
            onRestoreAll={handleRestoreAll}
          />
          <Button
            fullWidth
            size="lg"
            variant={applied ? "secondary" : "primary"}
            onClick={handleApply}
            disabled={
              applied ||
              (adjustedResult.totalAllocated <= 0 &&
                adjustedResult.vitalFundReserved <= 0)
            }
          >
            {applied ? (
              <>
                <CheckCircle2 size={20} />
                ¡Aplicado!
              </>
            ) : excludedLines.size > 0 ? (
              "Aplicar mi plan"
            ) : (
              "Aplicar recomendación"
            )}
          </Button>
        </>
      )}
    </div>
  );
}
