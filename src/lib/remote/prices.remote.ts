import { error } from "@sveltejs/kit";
import { and, desc, eq, gt } from "drizzle-orm";
import * as v from "valibot";
import type { PriceSource } from "#lib/current-prices.svelte.js";
import { LIVE_PRICE_COOLDOWN } from "#lib/live-price-cooldown.js";
import { isClosedFor, MARKETS_CLOSED_MESSAGE } from "#lib/market-hours.js";
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

type LivePrice = { price: number; source: "finnhub" | "yahoo" };

/** Calls the price APIs and adds the result to the shared price history. */
async function fetchAndRecord(ticker: string): Promise<LivePrice> {
  const live = await fetchPriceGbp(ticker);
  // stored at the column's precision so the UI matches what's saved
  const price = Math.round(live.price * 10_000) / 10_000;
  await db
    .insert(priceQuote)
    .values({
      ticker,
      price: String(price),
      quotedPrice: String(live.quotedPrice),
      currency: live.currency,
      source: live.source,
    })
    // a failure here shouldn't cost the user their price
    .catch((e: unknown) => console.error("Couldn't record price quote", e));
  return { price, source: live.source };
}

/** Lookups in progress per ticker, so simultaneous checks share one API call. */
const inFlight = new Map<string, Promise<LivePrice>>();

/**
 * The live price, reusing anyone's quote from the last minute rather than
 * calling the price APIs again.
 */
function livePrice(ticker: string): Promise<LivePrice> {
  let pending = inFlight.get(ticker);
  if (!pending) {
    pending = (async () => {
      const [recent] = await db
        .select({ price: priceQuote.price, source: priceQuote.source })
        .from(priceQuote)
        .where(
          and(
            eq(priceQuote.ticker, ticker),
            gt(
              priceQuote.fetchedAt,
              new Date(Date.now() - LIVE_PRICE_COOLDOWN),
            ),
          ),
        )
        .orderBy(desc(priceQuote.fetchedAt))
        .limit(1);
      if (recent) return { price: Number(recent.price), source: recent.source };
      return fetchAndRecord(ticker);
    })().finally(() => inFlight.delete(ticker));
    inFlight.set(ticker, pending);
  }
  return pending;
}

/**
 * Gets the live price, saves it, and returns it in GBP with its source and
 * time. Each user can check a ticker once a minute. At weekends only a ticker
 * without a live price yet can be checked (see `isClosedFor`).
 */
export const refreshCurrentPrice = command(Ticker, async (ticker) => {
  const id = requireUserId();

  const [mine] = await db
    .select({ source: currentPrice.source, updatedAt: currentPrice.updatedAt })
    .from(currentPrice)
    .where(and(eq(currentPrice.userId, id), eq(currentPrice.ticker, ticker)));
  if (isClosedFor(mine?.source)) error(409, MARKETS_CLOSED_MESSAGE);
  if (mine && mine.source !== "manual") {
    const wait = mine.updatedAt.getTime() + LIVE_PRICE_COOLDOWN - Date.now();
    if (wait > 0)
      error(
        429,
        `You can check ${ticker} again in ${Math.ceil(wait / 1000)} seconds`,
      );
  }

  let live: LivePrice;
  try {
    live = await livePrice(ticker);
  } catch (e) {
    if (e instanceof PriceError) error(400, e.message);
    console.error(e);
    error(502, "Couldn't get the latest price, please try again");
  }

  const updatedAt = new Date();
  await savePrice(id, ticker, live.price, live.source, updatedAt);
  return { ...live, updatedAt: updatedAt.getTime() };
});
