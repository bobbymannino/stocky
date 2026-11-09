import { createContext } from "svelte";
import { DEFAULT_PREFERENCES, type CurrencyMode } from "#lib/preferences.js";
import { formatMoney, formatSignedMoney } from "#lib/utils.js";

// context, not module state: the server renders many users at once
const [getMode, setMode] = createContext<() => CurrencyMode>();

/** Call in a layout so everything inside it formats money the user's way. */
export function setCurrencyMode(mode: () => CurrencyMode) {
  setMode(mode);
}

/**
 * Money formatters that follow the user's currency preference. Call during
 * component init; outside a layout that set one, the default is used.
 */
export function useMoney() {
  let mode: () => CurrencyMode;
  try {
    mode = getMode();
  } catch {
    mode = () => DEFAULT_PREFERENCES.currencyMode;
  }
  return {
    format: (amount: number) => formatMoney(amount, mode()),
    signed: (amount: number) => formatSignedMoney(amount, mode()),
  };
}
