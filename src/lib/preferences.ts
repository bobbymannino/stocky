/** How amounts of money are written. */
/** `pence` is stored for "under £1" from before always-pence existed. */
export const CURRENCY_MODES = ["pence", "pounds", "alwaysPence"] as const;
export type CurrencyMode = (typeof CURRENCY_MODES)[number];

export const CURRENCY_MODE_LABELS: Record<CurrencyMode, string> = {
  pence: "Pence when under £1",
  pounds: "Always £",
  alwaysPence: "Always pence",
};

/** Light or dark, or follow the device. */
export const APPEARANCES = ["system", "light", "dark"] as const;
export type Appearance = (typeof APPEARANCES)[number];

export const APPEARANCE_LABELS: Record<Appearance, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

/**
 * Themes used in light and in dark appearance. Each one is a palette in
 * `routes/layout.css`, under `[data-light-theme]` or `[data-dark-theme]`, that
 * fills every Catppuccin colour slot, so adding one is a CSS block and a name here.
 */
export const LIGHT_THEMES = ["latte"] as const;
export type LightTheme = (typeof LIGHT_THEMES)[number];
export const DARK_THEMES = ["mocha"] as const;
export type DarkTheme = (typeof DARK_THEMES)[number];

export const THEME_LABELS: Record<LightTheme | DarkTheme, string> = {
  latte: "Catppuccin Latte",
  mocha: "Catppuccin Mocha",
};

export type ThemePreferences = {
  appearance: Appearance;
  lightTheme: LightTheme;
  darkTheme: DarkTheme;
};

export type Preferences = { currencyMode: CurrencyMode } & ThemePreferences;

/** What a user gets until they choose otherwise. */
export const DEFAULT_PREFERENCES: Preferences = {
  currencyMode: "pence",
  appearance: "system",
  lightTheme: "latte",
  darkTheme: "mocha",
};

/** The `<html>` attributes that apply a user's theme (see `routes/layout.css`). */
export function themeAttributes(t: ThemePreferences) {
  return {
    "data-appearance": t.appearance,
    "data-light-theme": t.lightTheme,
    "data-dark-theme": t.darkTheme,
  };
}

/** Applies a theme to the open page, e.g. straight after the user picks one. */
export function applyTheme(t: ThemePreferences) {
  for (const [name, value] of Object.entries(themeAttributes(t)))
    document.documentElement.setAttribute(name, value);
}
