/**
 * Trading 212's public Invest page for a ticker, e.g. `AAPL` → `…/AAPL.US`
 * and `VOD.L` → `…/VOD.UK`. Their pages are the exchange-local symbol plus a
 * market code; London tickers end in `.L` here, anything else is treated as US.
 */
export function trading212Url(ticker: string) {
  const [symbol, market] = ticker.endsWith(".L")
    ? [ticker.slice(0, -2), "GB"]
    : [ticker, "US"];
  return `https://www.trading212.com/trading-instruments/invest/${encodeURIComponent(symbol)}.${market}`;
}
