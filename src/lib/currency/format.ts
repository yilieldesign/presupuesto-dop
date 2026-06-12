import type { Currency } from "@/types";

const DOP_FORMATTER = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un monto estrictamente en Pesos Dominicanos (RD$). */
export function formatDOP(amount: number): string {
  return DOP_FORMATTER.format(amount);
}

/** Formatea un monto en Dólares estadounidenses (US$). */
export function formatUSD(amount: number): string {
  return USD_FORMATTER.format(amount);
}

/** Formatea según la moneda de la deuda. */
export function formatMoney(amount: number, currency: Currency): string {
  return currency === "USD" ? formatUSD(amount) : formatDOP(amount);
}

export function currencySymbol(currency: Currency): string {
  return currency === "USD" ? "US$" : "RD$";
}

/** Parsea texto de entrada a número (acepta comas o puntos). */
export function parseMoneyInput(value: string): number {
  const normalized = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** @deprecated Usa parseMoneyInput */
export function parseDOPInput(value: string): number {
  return parseMoneyInput(value);
}
