import { error, redirect } from "@sveltejs/kit";
import { and, desc, eq, isNull } from "drizzle-orm";
import { definePageMetaTags } from "svelte-meta-tags";
import type { CompanyColors } from "#lib/company-colors.js";
import type { SavedPrices } from "#lib/current-prices.svelte.js";
import { ensureCompanyColors } from "#lib/server/company-colors.js";
import { db } from "#lib/server/db/index.js";
import { currentPrice, priceQuote, purchase } from "#lib/server/db/schema.js";
import type { PageServerLoad } from "./$types";

/** Enough points for a detailed line without sending an unbounded history. */
const MAX_QUOTES = 2000;

/** Same shape the price commands accept. */
const TICKER = /^[A-Z0-9.-]{1,10}$/;

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.auth) redirect(303, "/login");
  const userId = locals.auth.user.id;
  const ticker = params.ticker.toUpperCase();
  if (!TICKER.test(ticker)) error(404, "Not found");

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
    // any company can be viewed; only ones the user holds get a saved colour
    purchases.length > 0
      ? ensureCompanyColors(userId, [ticker])
      : ({} as CompanyColors),
  ]);

  const prices: SavedPrices = {};
  for (const r of saved)
    prices[r.ticker] = {
      price: Number(r.price),
      source: r.source,
      updatedAt: r.updatedAt.getTime(),
    };

  return {
    ticker,
    // names come from the user's own purchases, so unheld companies have none
    companyName: purchases[0]?.companyName,
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
