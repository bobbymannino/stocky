import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";
import type { PriceSource } from "#lib/current-prices.svelte.js";
import { db } from "#lib/server/db/index.js";
import { currentPrice, priceQuote } from "#lib/server/db/schema.js";
import { fetchPriceGbp, PriceError } from "#lib/server/live-prices.js";
import { command, getRequestEvent } from "$app/server";

const Ticker = v.pipe(
  v.string(),
  v.trim(),
  v.toUpperCase(),
  v.nonEmpty(),
  v.maxLength(10),
  v.regex(/^[A-Z0-9.-]+$/),
);

function requireUserId() {
  const { locals } = getRequestEvent();
  if (!locals.auth) error(401, "You need to be signed in");
  return locals.auth.user.id;
}

async function savePrice(
  userId: string,
  ticker: string,
  price: number,
  source: PriceSource,
  updatedAt: Date,
) {
  const values = { price: String(price), source, updatedAt } as const;
  await db
    .insert(currentPrice)
    .values({ userId, ticker, ...values })
    .onConflictDoUpdate({
      target: [currentPrice.userId, currentPrice.ticker],
      set: values,
    });
}

/** Saves the price the user typed in, or clears it when `price` is null. */
export const setCurrentPrice = command(
  v.object({
    ticker: Ticker,
    price: v.nullable(v.pipe(v.number(), v.finite(), v.minValue(0))),
  }),
  async ({ ticker, price }) => {
    const id = requireUserId();
    if (price === null) {
      await db
        .delete(currentPrice)
        .where(
          and(eq(currentPrice.userId, id), eq(currentPrice.ticker, ticker)),
        );
    } else {
      await savePrice(id, ticker, price, "manual", new Date());
    }
  },
);

/** Fetches the live price, saves it, and returns it in GBP with its source and time. */
export const refreshCurrentPrice = command(Ticker, async (ticker) => {
  const id = requireUserId();
  let live: Awaited<ReturnType<typeof fetchPriceGbp>>;
  try {
    live = await fetchPriceGbp(ticker);
  } catch (e) {
    if (e instanceof PriceError) error(400, e.message);
    console.error(e);
    error(502, "Couldn't get the latest price, please try again");
  }
  const { source } = live;
  // stored at the column's precision so the UI matches what's saved
  const price = Math.round(live.price * 10_000) / 10_000;
  const updatedAt = new Date();

  await Promise.all([
    savePrice(id, ticker, price, source, updatedAt),
    // shared price history; a failure here shouldn't cost the user their price
    db
      .insert(priceQuote)
      .values({
        ticker,
        price: String(price),
        quotedPrice: String(live.quotedPrice),
        currency: live.currency,
        source,
        fetchedAt: updatedAt,
      })
      .catch((e: unknown) => console.error("Couldn't record price quote", e)),
  ]);

  return { price, source, updatedAt: updatedAt.getTime() };
});
