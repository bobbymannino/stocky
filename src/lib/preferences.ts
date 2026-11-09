/** How amounts of money are written. */
/** `pence` is stored for "under £1" from before always-pence existed. */
export const CURRENCY_MODES = ["pence", "pounds", "alwaysPence"] as const;
export type CurrencyMode = (typeof CURRENCY_MODES)[number];

export const CURRENCY_MODE_LABELS: Record<CurrencyMode, string> = {
  pence: "Pence when under £1",
  pounds: "Always £",
  alwaysPence: "Always pence",
};

export type Preferences = { currencyMode: CurrencyMode };

/** What a user gets until they choose otherwise. */
export const DEFAULT_PREFERENCES: Preferences = { currencyMode: "pence" };
