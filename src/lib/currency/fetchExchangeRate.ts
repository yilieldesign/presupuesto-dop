import { DEFAULT_EXCHANGE_RATE, roundMoney } from "./convert";

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

export { REFRESH_INTERVAL_MS };

export interface ExchangeRateFetchResult {
  rate: number;
  source: string;
  fetchedAt: string;
}

/**
 * Obtiene USD → DOP desde Frankfurter (sin API key).
 * Si falla, devuelve null para conservar la tasa guardada.
 */
export async function fetchUsdToDopRate(): Promise<ExchangeRateFetchResult | null> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=DOP"
    );

    if (!res.ok) return null;

    const data = (await res.json()) as { rates?: { DOP?: number } };
    const dop = data.rates?.DOP;

    if (!dop || dop <= 0) return null;

    return {
      rate: roundMoney(dop),
      source: "Frankfurter / mercado",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function formatRateAge(isoDate: string | null): string {
  if (!isoDate) return "sin actualizar";

  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;

  return new Date(isoDate).toLocaleDateString("es-DO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isRateStale(
  isoDate: string | null,
  maxAgeMs = REFRESH_INTERVAL_MS
): boolean {
  if (!isoDate) return true;
  return Date.now() - new Date(isoDate).getTime() > maxAgeMs;
}

export function getFallbackRate(current: number): number {
  return current > 0 ? current : DEFAULT_EXCHANGE_RATE;
}
