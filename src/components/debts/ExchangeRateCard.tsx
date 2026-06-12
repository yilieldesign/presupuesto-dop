"use client";

import { useState } from "react";
import { DollarSign, RefreshCw, Wifi } from "lucide-react";
import { formatRateAge } from "@/lib/currency/fetchExchangeRate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ExchangeRateCardProps {
  exchangeRate: number;
  exchangeRateUpdatedAt: string | null;
  exchangeRateAuto: boolean;
  onSaveManual: (rate: number) => void;
  onEnableAuto: () => void;
  onRefresh: () => void;
}

export function ExchangeRateCard({
  exchangeRate,
  exchangeRateUpdatedAt,
  exchangeRateAuto,
  onSaveManual,
  onEnableAuto,
  onRefresh,
}: ExchangeRateCardProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const handleSave = () => {
    const rate = parseFloat(value.replace(",", ".")) || 0;
    if (rate > 0) {
      onSaveManual(rate);
      setEditing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card padding="sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-[var(--ios-green)]" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-[var(--ios-muted)]">Tasa del dólar</p>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                  exchangeRateAuto
                    ? "bg-[var(--ios-green)]/15 text-[var(--ios-green)]"
                    : "bg-[var(--ios-orange)]/15 text-[var(--ios-orange)]"
                }`}
              >
                {exchangeRateAuto ? "Auto" : "Manual"}
              </span>
            </div>
            <p className="text-sm font-bold">
              RD${exchangeRate.toFixed(2)} / US$1
            </p>
            <p className="text-[10px] text-[var(--ios-muted)]">
              {exchangeRateAuto ? (
                <span className="inline-flex items-center gap-1">
                  <Wifi size={10} />
                  Actualizada {formatRateAge(exchangeRateUpdatedAt)}
                </span>
              ) : (
                "Tasa fijada por ti"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg p-2 text-[var(--ios-tint)] active:bg-[var(--ios-bg)] disabled:opacity-40"
            aria-label="Actualizar tasa"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setValue(String(exchangeRate));
                setEditing(true);
              }}
              className="rounded-lg px-2 py-2 text-sm font-medium text-[var(--ios-tint)]"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-3 flex items-center gap-2 border-t border-[var(--ios-separator)] pt-3">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--ios-separator)] bg-[var(--ios-bg)] px-3 py-2 text-sm outline-none"
            autoFocus
          />
          <Button size="sm" onClick={handleSave}>
            OK
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setEditing(false)}
          >
            ✕
          </Button>
        </div>
      )}

      {!exchangeRateAuto && (
        <button
          type="button"
          onClick={onEnableAuto}
          className="mt-2 text-[10px] font-medium text-[var(--ios-tint)]"
        >
          Volver a actualización automática
        </button>
      )}

      <p className="mt-2 text-[10px] leading-tight text-[var(--ios-muted)]">
        {exchangeRateAuto
          ? "Se actualiza sola al abrir la app, cada 30 min y al volver del fondo."
          : "En modo manual no cambia sola. Toca ↻ para forzar actualización."}
      </p>
    </Card>
  );
}
