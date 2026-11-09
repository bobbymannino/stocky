import { redirect } from "@sveltejs/kit";
import { and, desc, eq, isNull } from "drizzle-orm";
import { definePageMetaTags } from "svelte-meta-tags";
import type { SavedPrices } from "#lib/current-prices.svelte.js";
import { auth } from "#lib/server/auth.js";
import { ensureCompanyColors } from "#lib/server/company-colors.js";
import { db } from "#lib/server/db/index.js";
import { currentPrice, purchase } from "#lib/server/db/schema.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.auth) redirect(303, "/login");

  const purchases = await db
    .select()
    .from(purchase)
    .where(
      and(
        eq(purchase.userId, locals.auth.user.id),
        isNull(purchase.archivedAt),
      ),
    )
    .orderBy(desc(purchase.boughtAt), desc(purchase.createdAt));

  // also backfills colours for companies added before colours existed
  const colors = await ensureCompanyColors(
    locals.auth.user.id,
    purchases.map((p) => p.ticker),
  );

  const priceRows = await db
    .select()
    .from(currentPrice)
    .where(eq(currentPrice.userId, locals.auth.user.id));
  const prices: SavedPrices = {};
  for (const r of priceRows)
    prices[r.ticker] = {
      price: Number(r.price),
      source: r.source,
      updatedAt: r.updatedAt.getTime(),
    };

  return {
    purchases,
    colors,
    prices,
    ...definePageMetaTags({
      title: "Portfolio",
      description: "Your recorded share purchases.",
    }),
  };
};

export const actions: Actions = {
  signOut: async ({ request }) => {
    await auth.api.signOut({ headers: request.headers });
    redirect(303, "/login");
  },
};
