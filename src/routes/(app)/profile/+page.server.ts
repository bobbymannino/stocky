import { redirect } from "@sveltejs/kit";
import { and, countDistinct, count, eq, isNull } from "drizzle-orm";
import { definePageMetaTags } from "svelte-meta-tags";
import { holdingsSummary } from "#lib/purchases.js";
import { auth } from "#lib/server/auth.js";
import { db } from "#lib/server/db/index.js";
import { currentPrice, purchase } from "#lib/server/db/schema.js";
import { loginUrl } from "#lib/server/login-redirect.js";
import type { Actions, PageServerLoad } from "./$types";

// the user's details come from the (app) layout; this adds a few totals
export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.auth) redirect(303, loginUrl(url));

  const userId = locals.auth.user.id;
  const current = and(eq(purchase.userId, userId), isNull(purchase.archivedAt));

  const [[totals], held, priceRows] = await Promise.all([
    db
      .select({
        purchases: count(),
        companies: countDistinct(purchase.ticker),
      })
      .from(purchase)
      .where(current),
    // wishlist trades are pretend, so they stay out of the holdings summary
    db
      .select({
        ticker: purchase.ticker,
        pricePerShare: purchase.pricePerShare,
        shares: purchase.shares,
      })
      .from(purchase)
      .where(and(current, eq(purchase.wishlist, false))),
    db
      .select({ ticker: currentPrice.ticker, price: currentPrice.price })
      .from(currentPrice)
      .where(eq(currentPrice.userId, userId)),
  ]);

  const prices = Object.fromEntries(
    priceRows.map((r) => [r.ticker, Number(r.price)]),
  );

  return {
    totals,
    holdings: holdingsSummary(held, prices),
    ...definePageMetaTags({
      title: "Profile",
      description: "Your Stocky account details.",
    }),
  };
};

export const actions: Actions = {
  signOut: async ({ request }) => {
    await auth.api.signOut({ headers: request.headers });
    redirect(303, "/login");
  },
};
