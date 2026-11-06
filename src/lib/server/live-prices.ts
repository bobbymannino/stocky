import { FINNHUB_TOKEN } from "$app/env/private";

const FINNHUB_URL = "https://finnhub.io/api/v1";
/** Unofficial, keyless Yahoo Finance endpoint; covers London (e.g. `VOD.L`). */
const YAHOO_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
/** Free ECB exchange rates, no key needed. */
const FX_URL = "https://api.frankfurter.dev/v1/latest";

const TIMEOUT = 10_000;

export type LiveSource = "finnhub" | "yahoo";

/** A problem the user can act on, safe to show them as-is. */
export class PriceError extends Error {}

/** A quote in the stock's own trading currency. */
type Quote = { price: number; currency: string };

/**
 * Finnhub returned nothing usable for this ticker (unknown, or outside the
 * free plan, which is US-only), so another source should be tried.
 */
class NotCovered extends Error {}

// --- Finnhub -----------------------------------------------------------------

async function finnhub<T>(path: string, params: Record<string, string>) {
  if (!FINNHUB_TOKEN) throw new NotCovered();

  const url = new URL(`${FINNHUB_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("token", FINNHUB_TOKEN);

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (res.status === 429)
    throw new PriceError("Too many price requests, try again in a minute");
  // the free plan only covers US exchanges; others come back as 403
  if (res.status === 403) throw new NotCovered();
  if (!res.ok) throw new Error(`Finnhub ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

/** A company's trading currency rarely changes, so it's cached for the process. */
const finnhubCurrencies = new Map<string, string>();

async function finnhubCurrency(ticker: string): Promise<string> {
  const cached = finnhubCurrencies.get(ticker);
  if (cached) return cached;
  const profile = await finnhub<{ currency?: string }>("/stock/profile2", {
    symbol: ticker,
  });
  // an empty profile means Finnhub doesn't know the ticker
  if (!profile.currency) throw new NotCovered();
  finnhubCurrencies.set(ticker, profile.currency);
  return profile.currency;
}

async function finnhubQuote(ticker: string): Promise<Quote> {
  const [quote, currency] = await Promise.all([
    finnhub<{ c?: number }>("/quote", { symbol: ticker }),
    finnhubCurrency(ticker),
  ]);
  // unknown tickers return a zero price rather than an error
  if (!quote.c) throw new NotCovered();
  return { price: quote.c, currency };
}

// --- Yahoo -------------------------------------------------------------------

async function yahooQuote(ticker: string): Promise<Quote> {
  const url = new URL(`${YAHOO_URL}/${encodeURIComponent(ticker)}`);
  url.searchParams.set("range", "1d");
  url.searchParams.set("interval", "1d");

  // Yahoo rejects requests without a user agent
  const res = await fetch(url, {
    headers: { "User-Agent": "stocky/1.0" },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (res.status === 404) throw new PriceError(`No price found for ${ticker}`);
  if (res.status === 429)
    throw new PriceError("Too many price requests, try again in a minute");
  if (!res.ok) throw new Error(`Yahoo quote failed: ${res.status}`);

  const body = (await res.json()) as {
    chart?: {
      result?: { meta?: { regularMarketPrice?: number; currency?: string } }[];
    };
  };
  const meta = body.chart?.result?.[0]?.meta;
  if (!meta?.regularMarketPrice || !meta.currency)
    throw new PriceError(`No price found for ${ticker}`);
  return { price: meta.regularMarketPrice, currency: meta.currency };
}

// --- Currency ----------------------------------------------------------------

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
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok)
    throw new PriceError(`Couldn't convert ${currency} to GBP right now`);
  const body = (await res.json()) as { rates?: { GBP?: number } };
  const rate = body.rates?.GBP;
  if (!rate) throw new PriceError(`Couldn't convert ${currency} to GBP`);

  rates.set(currency, { rate, fetchedAt: Date.now() });
  return rate;
}

// --- Public ------------------------------------------------------------------

/**
 * The latest price per share for a ticker, converted to GBP. Tries Finnhub
 * first (official, US stocks), then Yahoo for anything it doesn't cover, such
 * as London tickers like `VOD.L`.
 */
export async function fetchPriceGbp(
  ticker: string,
): Promise<{ price: number; source: LiveSource }> {
  let quote: Quote;
  let source: LiveSource;
  try {
    quote = await finnhubQuote(ticker);
    source = "finnhub";
  } catch (e) {
    if (!(e instanceof NotCovered)) throw e;
    quote = await yahooQuote(ticker);
    source = "yahoo";
  }
  return { price: quote.price * (await toGbpRate(quote.currency)), source };
}
