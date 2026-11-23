import { desc, eq, sql } from "drizzle-orm";
import { db } from "#lib/server/db/index.js";
import { dividend, dividendFetch } from "#lib/server/db/schema.js";
import { fetchDividends, PriceError } from "#lib/server/live-prices.js";

export type DividendInfo = {
  /** Newest first. */
  dividends: { exDate: string; amount: number }[];
  /** Per share in GBP, summed over ex-dates in the last 12 months. */
  trailingYear: number;
  /** Set when a refresh failed; `dividends` may then be stale or empty. */
  error?: string;
};

/** Midnight UTC today: a fetch since then means the ticker is fresh. */
function startOfTodayUtc(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/** Fetches from Yahoo and saves, unless this ticker was already fetched today. */
async function refreshIfStale(ticker: string): Promise<string | undefined> {
  const [last] = await db
    .select({ fetchedAt: dividendFetch.fetchedAt })
    .from(dividendFetch)
    .where(eq(dividendFetch.ticker, ticker));
  if (last && last.fetchedAt >= startOfTodayUtc()) return;

  let fetched;
  try {
    fetched = await fetchDividends(ticker);
  } catch (e) {
    // keep serving what's stored; a failed fetch isn't recorded, so it retries
    if (e instanceof PriceError) return e.message;
    console.error(`Dividend fetch for ${ticker} failed`, e);
    return "Couldn't load dividends right now";
  }

  await db.transaction(async (tx) => {
    if (fetched.length > 0)
      await tx
        .insert(dividend)
        .values(
          fetched.map((d) => ({
            ticker,
            exDate: d.exDate,
            amount: String(d.amount),
            quotedAmount: String(d.quotedAmount),
            currency: d.currency,
          })),
        )
        .onConflictDoUpdate({
          target: [dividend.ticker, dividend.exDate],
          set: {
            amount: sql`excluded.amount`,
            quotedAmount: sql`excluded.quoted_amount`,
            currency: sql`excluded.currency`,
            updatedAt: sql`now()`,
          },
        });
    await tx
      .insert(dividendFetch)
      .values({ ticker })
      .onConflictDoUpdate({
        target: dividendFetch.ticker,
        set: { fetchedAt: sql`now()` },
      });
  });
}

/**
 * A ticker's dividends from the shared `dividend` table, refreshed from Yahoo
 * at most once a day (UTC) per ticker. Never throws; problems come back as `error`.
 */
export async function getDividends(ticker: string): Promise<DividendInfo> {
  const error = await refreshIfStale(ticker);

  const rows = await db
    .select({ exDate: dividend.exDate, amount: dividend.amount })
    .from(dividend)
    .where(eq(dividend.ticker, ticker))
    .orderBy(desc(dividend.exDate));
  const dividends = rows.map((r) => ({
    exDate: r.exDate,
    amount: Number(r.amount),
  }));

  const yearAgo = new Date();
  yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1);
  const cutoff = yearAgo.toISOString().slice(0, 10);
  const trailingYear = dividends
    .filter((d) => d.exDate >= cutoff)
    .reduce((sum, d) => sum + d.amount, 0);

  return { dividends, trailingYear, error };
}
