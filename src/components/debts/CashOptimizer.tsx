"use client";

import { useState } from "react";
import { Zap, CheckCircle2 } from "lucide-react";
import { optimizeCashInjection } from "@/lib/debt/optimizer";
import type { OptimizationResult } from "@/lib/debt/optimizer";
import { parseDOPInput } from "@/lib/currency/format";
import type { Debt, DebtStrategy } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { OptimizationReceipt } from "./OptimizationReceipt";

interface CashOptimizerProps {
  debts: Debt[];
  strategy: DebtStrategy;
  exchangeRate: number;
  weeklyFixedFund: number;
  weekFundSpent: number;
  onApply: (result: OptimizationResult) => void;
}

export function CashOptimizer({
  debts,
  strategy,
  exchangeRate,
  weeklyFixedFund,
  weekFundSpent,
  onApply,
}: CashOptimizerProps) {
  const [cashInput, setCashInput] = useState("");
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [applied, setApplied] = useState(false);

  const activeDebts = debts.filter((d) => d.balance > 0);
  const cashAmount = parseDOPInput(cashInput);

  const handleOptimize = () => {
    if (cashAmount <= 0 || activeDebts.length === 0) return;

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
      strategy,
      exchangeRate,
      weeklyFixedFund,
      weekFundSpent,
    });

    setResult(optimized);
    setApplied(false);
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result);
    setApplied(true);
    setCashInput("");
    setResult(null);
  };

  if (activeDebts.length === 0) {
    return (
      <Card>
        <p className="text-center text-sm text-[var(--ios-muted)]">
          Registra al menos una deuda para usar el Optimizador de Menudeo.
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
              ¿Cuánto cobraste hoy? Reserva tu fondo vital primero.
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

      {result && (
        <>
          <OptimizationReceipt result={result} />
          <Button
            fullWidth
            size="lg"
            variant={applied ? "secondary" : "primary"}
            onClick={handleApply}
            disabled={
              applied ||
              (result.totalAllocated <= 0 && result.vitalFundReserved <= 0)
            }
          >
            {applied ? (
              <>
                <CheckCircle2 size={20} />
                ¡Aplicado!
              </>
            ) : (
              "Aplicar recomendación ahora"
            )}
          </Button>
        </>
      )}
    </div>
  );
}
