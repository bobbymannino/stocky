/** The ticker shape the price and purchase commands accept, e.g. `AAPL`, `VOD.L`. */
const TICKER = /^[A-Z0-9.-]{1,10}$/;

/** Trims and upper-cases `input`, or returns undefined if it isn't a ticker. */
export function parseTicker(input: string | null | undefined) {
  const ticker = input?.trim().toUpperCase();
  return ticker && TICKER.test(ticker) ? ticker : undefined;
}
