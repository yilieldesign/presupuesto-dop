"use client";

import { Trash2, Plus } from "lucide-react";
import { formatDOP } from "@/lib/currency/format";
import { getGoalProgress } from "@/lib/savings/stats";
import type { SavingsGoal } from "@/types";
import { Card } from "@/components/ui/Card";
import { SavingsIcon, getSavingsProgressBarClass } from "./SavingsIcon";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  onDeposit: (goalId: string) => void;
  onRemove: (goalId: string) => void;
}

export function SavingsGoalCard({
  goal,
  onDeposit,
  onRemove,
}: SavingsGoalCardProps) {
  const progress = getGoalProgress(goal);
  const remaining = Math.max(0, goal.targetAmount - goal.balance);
  const barClass = getSavingsProgressBarClass(goal.category);
  const completed = goal.balance >= goal.targetAmount && goal.targetAmount > 0;

  return (
    <Card padding="sm">
      <div className="flex items-start gap-3">
        <SavingsIcon category={goal.category} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold leading-tight">{goal.name}</p>
              <p className="text-lg font-bold text-[var(--ios-green)]">
                {formatDOP(goal.balance)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(goal.id)}
              className="shrink-0 rounded-lg p-1.5 text-[var(--ios-muted)] active:bg-[var(--ios-bg)]"
              aria-label={`Eliminar ${goal.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>

          <p className="text-xs text-[var(--ios-muted)]">
            Meta: {formatDOP(goal.targetAmount)}
            {!completed && remaining > 0 && (
              <> · Faltan {formatDOP(remaining)}</>
            )}
          </p>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ios-bg)]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barClass}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--ios-muted)]">
              {completed ? "¡Meta cumplida!" : `${progress.toFixed(0)}%`}
            </span>
            <button
              type="button"
              onClick={() => onDeposit(goal.id)}
              className="flex items-center gap-1 rounded-full bg-[var(--ios-green)]/15 px-3 py-1 text-xs font-semibold text-[var(--ios-green)] active:opacity-70"
            >
              <Plus size={12} strokeWidth={3} />
              Depositar
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
