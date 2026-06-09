"use client";

import { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { formatDOP, parseMoneyInput } from "@/lib/currency/format";
import {
  VITAL_FUND_CATEGORIES,
  getCategorySpent,
  getVitalFundLabel,
  getWeekFundSpentTotal,
  getWeeklyFundTotal,
} from "@/lib/budget/vitalFund";
import type { VitalFundCategory, WeeklyFundItem } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { VitalFundIcon } from "./VitalFundIcon";

interface WeeklyFundCardProps {
  items: WeeklyFundItem[];
  categorySpent: Partial<Record<VitalFundCategory, number>>;
  onSaveItems: (items: WeeklyFundItem[]) => void;
}

export function WeeklyFundCard({
  items,
  categorySpent,
  onSaveItems,
}: WeeklyFundCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftItems, setDraftItems] = useState<WeeklyFundItem[]>([]);
  const [newCategory, setNewCategory] = useState<VitalFundCategory>("comida");
  const [newAmount, setNewAmount] = useState("");

  const total = getWeeklyFundTotal(items);
  const spent = getWeekFundSpentTotal(categorySpent);
  const remaining = Math.max(0, total - spent);
  const spentPercent = total > 0 ? Math.min(100, (spent / total) * 100) : 0;

  const startEditing = () => {
    setDraftItems(items.length > 0 ? [...items] : []);
    setNewAmount("");
    setEditing(true);
  };

  const addDraftItem = () => {
    const amount = parseMoneyInput(newAmount);
    if (amount <= 0) return;

    setDraftItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category: newCategory,
        amount,
      },
    ]);
    setNewAmount("");
  };

  const removeDraftItem = (id: string) => {
    setDraftItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSave = () => {
    onSaveItems(draftItems);
    setEditing(false);
  };

  const groupedItems = items.reduce(
    (acc, item) => {
      const existing = acc.find((g) => g.category === item.category);
      if (existing) {
        existing.amount += item.amount;
      } else {
        acc.push({ ...item });
      }
      return acc;
    },
    [] as WeeklyFundItem[]
  );

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-[var(--ios-orange)]" />
          <h3 className="text-sm font-semibold">Fondo vital de la semana</h3>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="text-sm font-medium text-[var(--ios-tint)]"
          >
            {items.length > 0 ? "Editar" : "Configurar"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {draftItems.length > 0 && (
            <div className="space-y-2">
              {draftItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-[var(--ios-bg)] px-3 py-2.5"
                >
                  <VitalFundIcon category={item.category} size="sm" />
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    {getVitalFundLabel(item.category)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {formatDOP(item.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDraftItem(item.id)}
                      className="rounded-lg p-1 text-[var(--ios-muted)] active:bg-[var(--ios-card)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-right text-xs font-semibold text-[var(--ios-tint)]">
                Total: {formatDOP(getWeeklyFundTotal(draftItems))}
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs text-[var(--ios-muted)]">
              Agregar rubro
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VITAL_FUND_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setNewCategory(cat.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 transition-all active:scale-95 ${
                    newCategory === cat.id
                      ? "bg-[var(--ios-orange)]/15 ring-1 ring-[var(--ios-orange)]/50"
                      : "bg-[var(--ios-bg)]"
                  }`}
                >
                  <VitalFundIcon category={cat.id} size="sm" />
                  <span
                    className={`text-[10px] font-medium leading-tight ${
                      newCategory === cat.id
                        ? "text-[var(--ios-orange)]"
                        : "text-[var(--ios-muted)]"
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <MoneyInput
            label={`Monto semanal para ${getVitalFundLabel(newCategory)}`}
            value={newAmount}
            onChange={setNewAmount}
          />

          <Button variant="secondary" fullWidth onClick={addDraftItem}>
            <Plus size={16} />
            Agregar rubro
          </Button>

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" fullWidth onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={handleSave} disabled={draftItems.length === 0}>
              Guardar
            </Button>
          </div>
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold">{formatDOP(remaining)}</span>
            <span className="text-xs text-[var(--ios-muted)]">
              de {formatDOP(total)} disponible
            </span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--ios-bg)]">
            <div
              className="h-full rounded-full bg-[var(--ios-orange)] transition-all duration-500"
              style={{ width: `${spentPercent}%` }}
            />
          </div>

          <div className="space-y-2">
            {groupedItems.map((item) => {
              const catSpent = getCategorySpent(categorySpent, item.category);
              const catRemaining = Math.max(0, item.amount - catSpent);
              const catPercent =
                item.amount > 0
                  ? Math.min(100, (catSpent / item.amount) * 100)
                  : 0;

              return (
                <div
                  key={item.category}
                  className="flex gap-3 rounded-xl bg-[var(--ios-bg)] px-3 py-2.5"
                >
                  <VitalFundIcon category={item.category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {getVitalFundLabel(item.category)}
                      </span>
                      <span className="font-semibold">
                        {formatDOP(catRemaining)}{" "}
                        <span className="text-xs font-normal text-[var(--ios-muted)]">
                          / {formatDOP(item.amount)}
                        </span>
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ios-card)]">
                      <div
                        className="h-full rounded-full bg-[var(--ios-orange)]/70 transition-all duration-500"
                        style={{ width: `${catPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-[var(--ios-muted)]">
            Gastado esta semana: {formatDOP(spent)}
          </p>
        </>
      ) : (
        <p className="text-sm text-[var(--ios-muted)]">
          Agrega rubros como comida, combustible y transporte para saber cuánto
          reservar antes de pagar deudas.
        </p>
      )}
    </Card>
  );
}
