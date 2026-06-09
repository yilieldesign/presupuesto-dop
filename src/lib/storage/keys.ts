/** v1 = estado limpio para primer uso en producción. */
export const APP_STATE_VERSION = 1;

export const STORAGE_KEYS = {
  APP_STATE: `presupuesto-dop:v${APP_STATE_VERSION}:state`,
  /** Clave antigua de desarrollo — se elimina al cargar. */
  LEGACY_APP_STATE: "presupuesto-dop:app-state",
} as const;
