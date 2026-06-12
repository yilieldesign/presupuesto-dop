"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { fromDOP } from "@/lib/currency/convert";
import { formatMoney, parseMoneyInput } from "@/lib/currency/format";
import { needsMinimumUpdate } from "@/lib/debt/debtSchedule";
import type { Debt } from "@/types";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Button } from "@/components/ui/Button";

interface DebtMonthlyMinimumProps {
  debt: Debt;
  exchangeRate: number;
  onSave: (minimumPayment: number) => void;
}

export function DebtMonthlyMinimum({
  debt,
  exchangeRate,
  onSave,
}: DebtMonthlyMinimumProps) {
  const [editing, setEditing] = useState(false);
  const [inputInDOP, setInputInDOP] = useState(debt.currency === "USD");
  const [draft, setDraft] = useState("");

  const stale = needsMinimumUpdate(debt);
  const inputCurrency =
    debt.currency === "USD" && inputInDOP ? "DOP" : debt.currency;

  const openEditor = () => {
    setDraft(String(debt.minimumPayment));
    setInputInDOP(debt.currency === "USD");
    setEditing(true);
  };

  const handleSave = () => {
    const parsed = parseMoneyInput(draft);
    if (parsed <= 0) return;

    const native =
      debt.currency === "USD" && inputInDOP
        ? fromDOP(parsed, "USD", exchangeRate)
        : parsed;

    if (native <= 0) return;
    onSave(Math.round(native * 100) / 100);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="mt-2 rounded-xl bg-[var(--ios-bg)] p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--ios-muted)]">
              Mínimo este mes
            </p>
            <p className="text-sm font-semibold">
              {formatMoney(debt.minimumPayment, debt.currency)}
            </p>
            {debt.currency === "USD" && (
              <p className="text-[10px] text-[var(--ios-muted)]">
                Según tu estado de cuenta
              </p>
            )}
            {stale && (
              <p className="mt-1 text-[10px] font-medium text-[var(--ios-orange)]">
                Actualiza con el mínimo del estado de cuenta
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={openEditor}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ios-tint)]/10 text-[var(--ios-tint)]"
            aria-label={`Cambiar mínimo de ${debt.name}`}
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>
    );
  }

  const parsedDraft = parseMoneyInput(draft);
  const previewNative =
    debt.currency === "USD" && inputInDOP
      ? fromDOP(parsedDraft, "USD", exchangeRate)
      : parsedDraft;

  return (
    <div className="mt-2 space-y-2 rounded-xl bg-[var(--ios-bg)] p-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--ios-muted)]">
        Mínimo de este mes
      </p>

      {debt.currency === "USD" && (
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setInputInDOP(true)}
            className={`rounded-lg py-1.5 text-[10px] font-semibold ${
              inputInDOP
                ? "bg-[var(--ios-green)]/15 text-[var(--ios-green)]"
                : "bg-[var(--ios-card)] text-[var(--ios-muted)]"
            }`}
          >
            En RD$
          </button>
          <button
            type="button"
            onClick={() => setInputInDOP(false)}
            className={`rounded-lg py-1.5 text-[10px] font-semibold ${
              !inputInDOP
                ? "bg-[var(--ios-tint)]/15 text-[var(--ios-tint)]"
                : "bg-[var(--ios-card)] text-[var(--ios-muted)]"
            }`}
          >
            En US$
          </button>
        </div>
      )}

      <MoneyInput
        value={draft}
        onChange={setDraft}
        currency={inputCurrency}
        size="md"
      />

      {debt.currency === "USD" && inputInDOP && parsedDraft > 0 && (
        <p className="text-[10px] text-[var(--ios-green)]">
          ≈ {formatMoney(previewNative, "USD")} en la tarjeta
        </p>
      )}

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => setEditing(false)}
        >
          Cancelar
        </Button>
        <Button size="sm" fullWidth onClick={handleSave}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
