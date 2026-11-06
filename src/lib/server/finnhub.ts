import { FINNHUB_TOKEN } from "$app/env/private";

const FINNHUB_URL = "https://finnhub.io/api/v1";
/** Free ECB exchange rates, no key needed. */
const FX_URL = "https://api.frankfurter.dev/v1/latest";

/** A problem the user can act on, safe to show them as-is. */
export class PriceError extends Error {}

export const finnhubEnabled = Boolean(FINNHUB_TOKEN);

async function finnhub<T>(path: string, params: Record<string, string>) {
  if (!FINNHUB_TOKEN) throw new PriceError("Live prices aren't set up");

  const url = new URL(`${FINNHUB_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("token", FINNHUB_TOKEN);

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (res.status === 429)
    throw new PriceError("Too many price requests, try again in a minute");
  // the free plan only covers US exchanges; others come back as 403
  if (res.status === 403)
    throw new PriceError("Live prices are only available for US stocks");
  if (!res.ok) throw new Error(`Finnhub ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

/** A company's trading currency rarely changes, so it's cached for the process. */
const currencies = new Map<string, string>();

async function tradingCurrency(ticker: string): Promise<string> {
  const cached = currencies.get(ticker);
  if (cached) return cached;
  const profile = await finnhub<{ currency?: string }>("/stock/profile2", {
    symbol: ticker,
  });
  // an empty profile means Finnhub doesn't know the ticker
  if (!profile.currency) throw new PriceError(`No price found for ${ticker}`);
  currencies.set(ticker, profile.currency);
  return profile.currency;
}

/** Rates only change daily, so an hour's cache is plenty. */
const rates = new Map<string, { rate: number; fetchedAt: number }>();
const RATE_TTL = 60 * 60 * 1000;

async function toGbpRate(currency: string): Promise<number> {
  if (currency === "GBP") return 1;
  // London prices are quoted in pence
  if (currency === "GBX" || currency === "GBp") return 0.01;

  const cached = rates.get(currency);
  if (cached && Date.now() - cached.fetchedAt < RATE_TTL) return cached.rate;

  const url = new URL(FX_URL);
  url.searchParams.set("base", currency);
  url.searchParams.set("symbols", "GBP");
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok)
    throw new PriceError(`Couldn't convert ${currency} to GBP right now`);
  const body = (await res.json()) as { rates?: { GBP?: number } };
  const rate = body.rates?.GBP;
  if (!rate) throw new PriceError(`Couldn't convert ${currency} to GBP`);

  rates.set(currency, { rate, fetchedAt: Date.now() });
  return rate;
}

/** The latest price per share for a ticker, converted to GBP. */
export async function fetchPriceGbp(ticker: string): Promise<number> {
  const [quote, currency] = await Promise.all([
    finnhub<{ c?: number }>("/quote", { symbol: ticker }),
    tradingCurrency(ticker),
  ]);
  // unknown tickers return a zero price rather than an error
  if (!quote.c) throw new PriceError(`No price found for ${ticker}`);
  return quote.c * (await toGbpRate(currency));
}
