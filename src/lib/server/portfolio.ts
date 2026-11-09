import { and, desc, eq, isNull } from "drizzle-orm";
import type { SavedPrices } from "#lib/current-prices.svelte.js";
import { ensureCompanyColors } from "#lib/server/company-colors.js";
import { db } from "#lib/server/db/index.js";
import { currentPrice, purchase } from "#lib/server/db/schema.js";

/**
 * A user's current purchases, newest first, with their colours and prices.
 * Wishlist trades come back separately so they never mix into real totals.
 */
export async function loadPortfolio(userId: string) {
  const all = await db
    .select()
    .from(purchase)
    .where(and(eq(purchase.userId, userId), isNull(purchase.archivedAt)))
    .orderBy(desc(purchase.boughtAt), desc(purchase.createdAt));

  // also backfills colours for companies added before colours existed
  const colors = await ensureCompanyColors(
    userId,
    all.map((p) => p.ticker),
  );

  const priceRows = await db
    .select()
    .from(currentPrice)
    .where(eq(currentPrice.userId, userId));
  const prices: SavedPrices = {};
  for (const r of priceRows)
    prices[r.ticker] = {
      price: Number(r.price),
      source: r.source,
      updatedAt: r.updatedAt.getTime(),
    };

  const { purchases, wishlist } = splitWishlist(all);
  return { purchases, wishlist, colors, prices };
}

/** Separates real purchases from wishlist trades, keeping their order. */
export function splitWishlist<T extends { wishlist: boolean }>(rows: T[]) {
  return {
    purchases: rows.filter((p) => !p.wishlist),
    wishlist: rows.filter((p) => p.wishlist),
  };
}

/** Ticker → most recent company name, from all the user's purchases. */
export async function loadCompanyNames(userId: string) {
  const rows = await db
    .select({ ticker: purchase.ticker, companyName: purchase.companyName })
    .from(purchase)
    .where(eq(purchase.userId, userId))
    .orderBy(desc(purchase.createdAt));

  // newest first, so keep the first (most recent) name per ticker
  const companies = new Map<string, string>();
  for (const { ticker, companyName } of rows)
    if (!companies.has(ticker)) companies.set(ticker, companyName);
  return companies;
}
