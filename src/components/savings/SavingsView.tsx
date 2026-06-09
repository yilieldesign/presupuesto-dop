"use client";

import { useState } from "react";
import { Plus, Sparkles, TrendingUp } from "lucide-react";
import { formatDOP, parseMoneyInput } from "@/lib/currency/format";
import { getDebtPaydownProgress } from "@/lib/budget/stats";
import {
  getTotalSaved,
  getTotalTarget,
  getMotivationMessage,
} from "@/lib/savings/stats";
import { SAVINGS_CATEGORIES, SAVINGS_PRESETS } from "@/lib/savings/categories";
import type { AppState, SavingsGoalCategory } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { SavingsGoalCard } from "./SavingsGoalCard";
import { SavingsIcon } from "./SavingsIcon";

interface SavingsViewProps {
  state: AppState;
  onAddGoal: (goal: {
    name: string;
    category: SavingsGoalCategory;
    targetAmount: number;
  }) => void;
  onRemoveGoal: (id: string) => void;
  onDeposit: (goalId: string, amount: number, note?: string) => void;
}

export function SavingsView({
  state,
  onAddGoal,
  onRemoveGoal,
  onDeposit,
}: SavingsViewProps) {
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [customName, setCustomName] = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const [customCategory, setCustomCategory] =
    useState<SavingsGoalCategory>("personal");

  const debtProgress = getDebtPaydownProgress(
    state.debts,
    state.exchangeRate
  );
  const motivation = getMotivationMessage(debtProgress);
  const totalSaved = getTotalSaved(state.savingsGoals);
  const totalTarget = getTotalTarget(state.savingsGoals);

  const toneStyles = {
    hope: "from-[var(--ios-tint)]/20 to-[var(--ios-bg)]",
    ready: "from-[var(--ios-green)]/20 to-[var(--ios-bg)]",
    celebrate: "from-[var(--ios-green)]/30 to-[var(--ios-orange)]/10",
  };

  const handleDeposit = () => {
    const amount = parseMoneyInput(depositAmount);
    if (!depositGoalId || amount <= 0) return;
    onDeposit(depositGoalId, amount);
    setDepositGoalId(null);
    setDepositAmount("");
  };

  const handleCreateCustom = () => {
    const target = parseMoneyInput(customTarget);
    if (!customName.trim() || target <= 0) return;
    onAddGoal({
      name: customName.trim(),
      category: customCategory,
      targetAmount: target,
    });
    setCustomName("");
    setCustomTarget("");
    setShowNewGoal(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <Card
        className={`bg-gradient-to-br ${toneStyles[motivation.tone]} border-none`}
      >
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--ios-green)]/20">
            <Sparkles size={20} className="text-[var(--ios-green)]" />
          </div>
          <div>
            <h2 className="text-base font-bold">{motivation.title}</h2>
            <p className="mt-1 text-sm leading-snug text-[var(--ios-muted)]">
              {motivation.subtitle}
            </p>
            {state.debts.length > 0 && (
              <p className="mt-2 text-xs font-medium text-[var(--ios-tint)]">
                Progreso de deudas: {debtProgress.toFixed(0)}%
              </p>
            )}
          </div>
        </div>
      </Card>

      {state.savingsGoals.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <Card padding="sm" className="text-center">
            <p className="text-[10px] text-[var(--ios-muted)]">Total ahorrado</p>
            <p className="text-lg font-bold text-[var(--ios-green)]">
              {formatDOP(totalSaved)}
            </p>
          </Card>
          <Card padding="sm" className="text-center">
            <p className="text-[10px] text-[var(--ios-muted)]">Metas definidas</p>
            <p className="text-lg font-bold">{formatDOP(totalTarget)}</p>
          </Card>
        </div>
      )}

      {state.savingsGoals.length > 0 ? (
        <div className="space-y-2">
          <h3 className="px-1 text-xs font-medium uppercase tracking-wider text-[var(--ios-muted)]">
            Tus metas
          </h3>
          {state.savingsGoals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onDeposit={setDepositGoalId}
              onRemove={onRemoveGoal}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center py-4 text-center">
            <TrendingUp size={32} className="mb-2 text-[var(--ios-green)]" />
            <p className="text-sm font-medium">Cuando mejore el flujo</p>
            <p className="mt-1 text-xs text-[var(--ios-muted)]">
              Crea metas para el día que los eventos paguen más que las deudas.
            </p>
          </div>
        </Card>
      )}

      {!showNewGoal ? (
        <Button variant="secondary" fullWidth onClick={() => setShowNewGoal(true)}>
          <Plus size={18} />
          Nueva meta de ahorro
        </Button>
      ) : (
        <Card>
          <h3 className="mb-3 text-sm font-semibold">Crear meta</h3>

          <p className="mb-2 text-xs text-[var(--ios-muted)]">Plantillas rápidas</p>
          <div className="mb-4 space-y-2">
            {SAVINGS_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() =>
                  onAddGoal({
                    name: preset.name,
                    category: preset.category,
                    targetAmount: preset.suggestedTarget,
                  })
                }
                className="flex w-full items-center gap-3 rounded-xl bg-[var(--ios-bg)] px-3 py-2.5 text-left active:opacity-70"
              >
                <SavingsIcon category={preset.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{preset.name}</p>
                  <p className="text-xs text-[var(--ios-muted)]">
                    Meta sugerida: {formatDOP(preset.suggestedTarget)}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <p className="mb-2 text-xs text-[var(--ios-muted)]">O personalizada</p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nombre de la meta"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full rounded-xl border border-[var(--ios-separator)] bg-[var(--ios-bg)] px-4 py-3 text-sm outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {SAVINGS_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCustomCategory(cat.id)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    customCategory === cat.id
                      ? "bg-[var(--ios-green)] text-white"
                      : "bg-[var(--ios-bg)] text-[var(--ios-muted)]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <MoneyInput
              label="Meta en RD$"
              value={customTarget}
              onChange={setCustomTarget}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowNewGoal(false)}
              >
                Cancelar
              </Button>
              <Button fullWidth onClick={handleCreateCustom}>
                Crear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm">
          <div
            className="w-full rounded-t-3xl bg-[var(--ios-card)] p-5"
            style={{ paddingBottom: "max(20px, var(--safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--ios-separator)]" />
            <h3 className="mb-1 text-lg font-bold">Depositar ahorro</h3>
            <p className="mb-4 text-sm text-[var(--ios-muted)]">
              {state.savingsGoals.find((g) => g.id === depositGoalId)?.name}
            </p>
            <MoneyInput
              value={depositAmount}
              onChange={setDepositAmount}
              placeholder="5,000"
              size="lg"
              autoFocus
            />
            <div className="mt-4 flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setDepositGoalId(null);
                  setDepositAmount("");
                }}
              >
                Cancelar
              </Button>
              <Button fullWidth onClick={handleDeposit}>
                Guardar depósito
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
