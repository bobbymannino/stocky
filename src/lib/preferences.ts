/** How amounts of money are written. */
export const CURRENCY_MODES = ["pence", "pounds"] as const;
export type CurrencyMode = (typeof CURRENCY_MODES)[number];

export const CURRENCY_MODE_LABELS: Record<CurrencyMode, string> = {
  pence: "Pence when under £1",
  pounds: "Always £",
};

export type Preferences = { currencyMode: CurrencyMode };

/** What a user gets until they choose otherwise. */
export const DEFAULT_PREFERENCES: Preferences = { currencyMode: "pence" };
