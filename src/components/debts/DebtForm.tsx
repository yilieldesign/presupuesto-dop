"use client";

import { useState } from "react";
import { Plus, CircleDollarSign, CreditCard, CalendarClock } from "lucide-react";
import { DebtIcon } from "./DebtIcon";
import type { Currency, DebtPaymentPriority } from "@/types";
import { fromDOP } from "@/lib/currency/convert";
import { formatMoney, parseMoneyInput } from "@/lib/currency/format";
import { computeNextPaymentDateFromDay, toDateKey } from "@/lib/budget/fixedExpenses";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoneyInput } from "@/components/ui/MoneyInput";

interface DebtFormProps {
  exchangeRate: number;
  onAdd: (debt: {
    name: string;
    currency: Currency;
    balance: number;
    interestRate: number;
    minimumPayment: number;
    paymentPriority: DebtPaymentPriority;
    nextPaymentDate?: string;
  }) => void;
}

export function DebtForm({ exchangeRate, onAdd }: DebtFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("DOP");
  const [inputInDOP, setInputInDOP] = useState(false);
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("");
  const [minimum, setMinimum] = useState("");
  const [paymentPriority, setPaymentPriority] =
    useState<DebtPaymentPriority>("flexible");
  const [paymentDate, setPaymentDate] = useState(
    computeNextPaymentDateFromDay(15)
  );

  const isUsd = currency === "USD";
  const inputCurrency: Currency = isUsd && inputInDOP ? "DOP" : currency;

  const parsedBalance = parseMoneyInput(balance);
  const parsedMinimum = parseMoneyInput(minimum);

  const balanceNative =
    isUsd && inputInDOP
      ? fromDOP(parsedBalance, "USD", exchangeRate)
      : parsedBalance;

  const minimumNative =
    isUsd && inputInDOP
      ? fromDOP(parsedMinimum, "USD", exchangeRate)
      : parsedMinimum;

  const handleCurrencyChange = (c: Currency) => {
    setCurrency(c);
    setInputInDOP(c === "USD");
    setBalance("");
    setMinimum("");
    if (c === "USD") {
      setPaymentPriority("scheduled");
    }
  };

  const handleSubmit = () => {
    const parsedRate = parseFloat(rate.replace(",", ".")) || 0;

    if (!name.trim() || balanceNative <= 0) return;

    onAdd({
      name: name.trim(),
      currency,
      balance: balanceNative,
      interestRate: parsedRate,
      minimumPayment: minimumNative,
      paymentPriority,
      nextPaymentDate:
        paymentPriority === "scheduled" ? paymentDate : undefined,
    });

    setName("");
    setBalance("");
    setRate("");
    setMinimum("");
    setPaymentPriority("flexible");
    setPaymentDate(computeNextPaymentDateFromDay(15));
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="secondary" fullWidth onClick={() => setOpen(true)}>
        <Plus size={18} />
        Registrar deuda
      </Button>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center gap-3">
        <DebtIcon
          name={name || (currency === "USD" ? "Tarjeta" : "Préstamo")}
          currency={currency}
          size="sm"
        />
        <h3 className="text-sm font-semibold">Nueva deuda</h3>
      </div>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Nombre (ej. Tarjeta Visa USD)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-[var(--ios-separator)] bg-[var(--ios-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--ios-tint)]"
        />

        <div>
          <label className="mb-2 block text-xs text-[var(--ios-muted)]">
            Tipo de deuda
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentPriority("scheduled")}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-semibold transition-colors ${
                paymentPriority === "scheduled"
                  ? "bg-[var(--ios-orange)]/15 text-[var(--ios-orange)] ring-1 ring-[var(--ios-orange)]/40"
                  : "bg-[var(--ios-bg)] text-[var(--ios-muted)]"
              }`}
            >
              <CalendarClock size={18} />
              Con fecha (tarjeta)
            </button>
            <button
              type="button"
              onClick={() => setPaymentPriority("flexible")}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-semibold transition-colors ${
                paymentPriority === "flexible"
                  ? "bg-[var(--ios-tint)]/15 text-[var(--ios-tint)] ring-1 ring-[var(--ios-tint)]/40"
                  : "bg-[var(--ios-bg)] text-[var(--ios-muted)]"
              }`}
            >
              <CircleDollarSign size={18} />
              Al paso (préstamo)
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-[var(--ios-muted)]">
            {paymentPriority === "scheduled"
              ? "Se prioriza por fecha de pago mensual."
              : "Se paga con bola de nieve o avalancha sin fecha fija."}
          </p>
        </div>

        {paymentPriority === "scheduled" && (
          <div>
            <label className="mb-1 block text-xs text-[var(--ios-muted)]">
              Fecha de pago mensual
            </label>
            <input
              type="date"
              value={paymentDate}
              min={toDateKey(new Date())}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--ios-separator)] bg-[var(--ios-bg)] px-4 py-3 text-sm outline-none"
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-xs text-[var(--ios-muted)]">
            Moneda de la deuda
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["DOP", "USD"] as const).map((c) => {
              const Icon = c === "USD" ? CreditCard : CircleDollarSign;
              const active = currency === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCurrencyChange(c)}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[var(--ios-tint)] text-white"
                      : "bg-[var(--ios-bg)] text-[var(--ios-muted)]"
                  }`}
                >
                  <Icon size={16} strokeWidth={2.25} />
                  {c === "DOP" ? "Pesos (RD$)" : "Dólares (US$)"}
                </button>
              );
            })}
          </div>
        </div>

        {isUsd && (
          <div>
            <label className="mb-2 block text-xs text-[var(--ios-muted)]">
              ¿Cómo quieres ingresar los montos?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInputInDOP(true)}
                className={`rounded-xl py-2 text-xs font-semibold transition-colors ${
                  inputInDOP
                    ? "bg-[var(--ios-green)]/15 text-[var(--ios-green)] ring-1 ring-[var(--ios-green)]/40"
                    : "bg-[var(--ios-bg)] text-[var(--ios-muted)]"
                }`}
              >
                En pesos (RD$)
              </button>
              <button
                type="button"
                onClick={() => setInputInDOP(false)}
                className={`rounded-xl py-2 text-xs font-semibold transition-colors ${
                  !inputInDOP
                    ? "bg-[var(--ios-tint)]/15 text-[var(--ios-tint)] ring-1 ring-[var(--ios-tint)]/40"
                    : "bg-[var(--ios-bg)] text-[var(--ios-muted)]"
                }`}
              >
                En dólares (US$)
              </button>
            </div>
            {inputInDOP && (
              <p className="mt-1.5 text-[10px] text-[var(--ios-muted)]">
                Tasa: RD${exchangeRate.toFixed(2)} / US$1 — se guarda en dólares
                automáticamente
              </p>
            )}
          </div>
        )}

        <div>
          <MoneyInput
            label="Monto pendiente"
            value={balance}
            onChange={setBalance}
            currency={inputCurrency}
          />
          {isUsd && inputInDOP && parsedBalance > 0 && (
            <p className="mt-1 text-xs text-[var(--ios-green)]">
              ≈ {formatMoney(balanceNative, "USD")} en la tarjeta
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-[var(--ios-muted)]">
              Tasa anual (%)
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="24"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full rounded-xl border border-[var(--ios-separator)] bg-[var(--ios-bg)] px-3 py-3 text-sm outline-none focus:border-[var(--ios-tint)]"
            />
          </div>
          <div>
            <MoneyInput
              label={
                paymentPriority === "scheduled"
                  ? "Mínimo de este mes"
                  : "Pago mínimo mensual"
              }
              value={minimum}
              onChange={setMinimum}
              currency={inputCurrency}
            />
            {paymentPriority === "scheduled" && (
              <p className="mt-1 text-[10px] text-[var(--ios-muted)]">
                En tarjetas el mínimo cambia cada mes — podrás actualizarlo
                cuando llegue el estado de cuenta.
              </p>
            )}
            {isUsd && inputInDOP && parsedMinimum > 0 && (
              <p className="mt-1 text-xs text-[var(--ios-green)]">
                ≈ {formatMoney(minimumNative, "USD")}/mes en la tarjeta
              </p>
            )}
            {isUsd && !inputInDOP && parsedMinimum > 0 && (
              <p className="mt-1 text-xs text-[var(--ios-muted)]">
                ≈ {formatMoney(parsedMinimum * exchangeRate, "DOP")}/mes
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button fullWidth onClick={handleSubmit}>
            Guardar
          </Button>
        </div>
      </div>
    </Card>
  );
}
