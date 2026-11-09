import { error } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import { db } from "#lib/server/db/index.js";
import { priceQuote, purchase } from "#lib/server/db/schema.js";
import { renderHoldingImage } from "#lib/server/og-image.js";
import { parseTicker } from "#lib/ticker.js";
import type { RequestHandler } from "./$types";

/** How long an image is reused, here and by browsers and link unfurlers. */
const CACHE_SECONDS = 10 * 60;

/** Ticker → rendered image, so repeat requests skip the database and render. */
const cache = new Map<string, { png: Uint8Array<ArrayBuffer>; expires: number }>();

/** Link previews are fetched without a session, so this is deliberately public. */
export const GET: RequestHandler = async ({ params, setHeaders }) => {
  const ticker = parseTicker(params.ticker);
  if (!ticker) error(404, "Not found");

  setHeaders({
    "content-type": "image/png",
    "cache-control": `public, max-age=${CACHE_SECONDS}`,
  });

  const hit = cache.get(ticker);
  if (hit && hit.expires > Date.now()) return new Response(hit.png);

  const [quotes, [named]] = await Promise.all([
    // the shared history, as on the page; the newest are kept if capped
    db
      .select({ price: priceQuote.price, fetchedAt: priceQuote.fetchedAt })
      .from(priceQuote)
      .where(eq(priceQuote.ticker, ticker))
      .orderBy(desc(priceQuote.fetchedAt))
      .limit(2000),
    // no viewer to ask, so use the most recent name anyone gave it
    db
      .select({ companyName: purchase.companyName })
      .from(purchase)
      .where(eq(purchase.ticker, ticker))
      .orderBy(desc(purchase.createdAt))
      .limit(1),
  ]);

  const png = await renderHoldingImage({
    ticker,
    companyName: named?.companyName,
    history: quotes
      .map((q) => ({ t: q.fetchedAt.getTime(), price: Number(q.price) }))
      .toReversed(),
  });

  // drop stale entries so tickers nobody asks for again don't pile up
  for (const [key, entry] of cache)
    if (entry.expires <= Date.now()) cache.delete(key);
  cache.set(ticker, { png, expires: Date.now() + CACHE_SECONDS * 1000 });
  return new Response(png);
};
