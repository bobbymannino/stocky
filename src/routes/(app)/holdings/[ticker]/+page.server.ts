import { error, redirect } from "@sveltejs/kit";
import { and, desc, eq, isNull } from "drizzle-orm";
import { definePageMetaTags } from "svelte-meta-tags";
import type { CompanyColors } from "#lib/company-colors.js";
import type { SavedPrices } from "#lib/current-prices.svelte.js";
import { ensureCompanyColors } from "#lib/server/company-colors.js";
import { db } from "#lib/server/db/index.js";
import { currentPrice, priceQuote, purchase } from "#lib/server/db/schema.js";
import { OG_HEIGHT, OG_WIDTH } from "#lib/server/og-image.js";
import { splitWishlist } from "#lib/server/portfolio.js";
import { parseTicker } from "#lib/ticker.js";
import type { PageServerLoad } from "./$types";

/** Enough points for a detailed line without sending an unbounded history. */
const MAX_QUOTES = 2000;

export const load: PageServerLoad = async ({ locals, params, url }) => {
  if (!locals.auth) redirect(303, "/login");
  const userId = locals.auth.user.id;
  const ticker = parseTicker(params.ticker);
  if (!ticker) error(404, "Not found");

  const all = await db
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

  const { purchases, wishlist } = splitWishlist(all);

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
    // any company can be viewed; only ones the user has added get a saved colour
    all.length > 0
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
    companyName: all[0]?.companyName,
    purchases,
    wishlist,
    colors,
    prices,
    history: quotes
      .map((q) => ({ t: q.fetchedAt.getTime(), price: Number(q.price) }))
      .toReversed(),
    ...definePageMetaTags({
      title: ticker,
      description: `Price history and your purchases of ${ticker}.`,
      openGraph: {
        images: [
          {
            url: new URL(`/holdings/${ticker}/og.png`, url.origin).href,
            width: OG_WIDTH,
            height: OG_HEIGHT,
            alt: `${ticker} price over time`,
          },
        ],
      },
      twitter: { cardType: "summary_large_image" },
    }),
  };
};
