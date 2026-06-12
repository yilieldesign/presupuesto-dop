"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  REFRESH_INTERVAL_MS,
  fetchUsdToDopRate,
  isRateStale,
} from "@/lib/currency/fetchExchangeRate";

interface UseExchangeRateRefreshOptions {
  hydrated: boolean;
  exchangeRateAuto: boolean;
  exchangeRateUpdatedAt: string | null;
  onUpdate: (rate: number, fetchedAt: string) => void;
}

export function useExchangeRateRefresh({
  hydrated,
  exchangeRateAuto,
  exchangeRateUpdatedAt,
  onUpdate,
}: UseExchangeRateRefreshOptions) {
  const fetching = useRef(false);

  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;

    try {
      const result = await fetchUsdToDopRate();
      if (result) {
        onUpdate(result.rate, result.fetchedAt);
      }
    } finally {
      fetching.current = false;
    }
  }, [onUpdate]);

  useEffect(() => {
    if (!hydrated || !exchangeRateAuto) return;

    if (isRateStale(exchangeRateUpdatedAt)) {
      refresh();
    }

    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible" && exchangeRateAuto) {
        refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hydrated, exchangeRateAuto, exchangeRateUpdatedAt, refresh]);

  return { refresh };
}
