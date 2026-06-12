import type { Currency } from "@/types";

export const DEFAULT_EXCHANGE_RATE = 58.5;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Convierte un monto a su equivalente en RD$ según la moneda de la deuda. */
export function toDOP(
  amount: number,
  currency: Currency,
  exchangeRate: number
): number {
  if (currency === "USD") return roundMoney(amount * exchangeRate);
  return roundMoney(amount);
}

/** Convierte RD$ al monto en la moneda nativa de la deuda. */
export function fromDOP(
  amountDOP: number,
  currency: Currency,
  exchangeRate: number
): number {
  if (currency === "USD") return roundMoney(amountDOP / exchangeRate);
  return roundMoney(amountDOP);
}
