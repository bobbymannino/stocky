import { redirect } from "@sveltejs/kit";
import { and, desc, eq, isNull } from "drizzle-orm";
import { definePageMetaTags } from "svelte-meta-tags";
import type { SavedPrices } from "#lib/current-prices.svelte.js";
import { ensureCompanyColors } from "#lib/server/company-colors.js";
import { db } from "#lib/server/db/index.js";
import { currentPrice, priceQuote, purchase } from "#lib/server/db/schema.js";
import type { PageServerLoad } from "./$types";

/** Enough points for a detailed line without sending an unbounded history. */
const MAX_QUOTES = 2000;

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.auth) redirect(303, "/login");
  const userId = locals.auth.user.id;
  const ticker = params.ticker.toUpperCase();

  const purchases = await db
    .select()
    .from(purchase)
    .where(
      and(
        eq(purchase.userId, userId),
        eq(purchase.ticker, ticker),
        isNull(purchase.archivedAt),
      ),
    )
    .orderBy(desc(purchase.boughtAt), desc(purchase.createdAt));

  if (params.ticker !== ticker) redirect(307, `/holdings/${ticker}`);
  // only holdings the user actually has; this is also where you land after
  // deleting your last purchase of it here, so go back to the portfolio
  if (purchases.length === 0) redirect(303, "/");

  const [quotes, saved, colors] = await Promise.all([
    // the shared history from every user's live fetches; newest kept if capped
    db
      .select({ price: priceQuote.price, fetchedAt: priceQuote.fetchedAt })
      .from(priceQuote)
      .where(eq(priceQuote.ticker, ticker))
      .orderBy(desc(priceQuote.fetchedAt))
      .limit(MAX_QUOTES),
    db
      .select()
      .from(currentPrice)
      .where(
        and(eq(currentPrice.userId, userId), eq(currentPrice.ticker, ticker)),
      ),
    ensureCompanyColors(userId, [ticker]),
  ]);

  const prices: SavedPrices = {};
  for (const r of saved)
    prices[r.ticker] = { price: Number(r.price), source: r.source };

  return {
    ticker,
    companyName: purchases[0].companyName,
    purchases,
    colors,
    prices,
    history: quotes
      .map((q) => ({ t: q.fetchedAt.getTime(), price: Number(q.price) }))
      .toReversed(),
    ...definePageMetaTags({
      title: ticker,
      description: `Price history and your purchases of ${ticker}.`,
    }),
  };
};
