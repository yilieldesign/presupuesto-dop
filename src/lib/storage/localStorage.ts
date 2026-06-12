import { DEFAULT_APP_STATE, type AppState } from "@/types";
import { STORAGE_KEYS } from "./keys";
import { resetAppStorage } from "./reset";
import { sanitizeAppState } from "./sanitize";

function purgeLegacyStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.LEGACY_APP_STATE);
}

export function loadAppState(): AppState {
  if (typeof window === "undefined") return DEFAULT_APP_STATE;

  purgeLegacyStorage();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.APP_STATE);
    if (!raw) return { ...DEFAULT_APP_STATE };

    return sanitizeAppState(JSON.parse(raw));
  } catch {
    resetAppStorage();
    return { ...DEFAULT_APP_STATE };
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(state));
}
