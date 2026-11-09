import { redirect } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import { definePageMetaTags } from "svelte-meta-tags";
import { db } from "#lib/server/db/index.js";
import { purchase } from "#lib/server/db/schema.js";
import { parseTicker } from "#lib/ticker.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.auth) redirect(303, "/login");

  // only what the form needs to auto-fill company names
  const rows = await db
    .select({ ticker: purchase.ticker, companyName: purchase.companyName })
    .from(purchase)
    .where(eq(purchase.userId, locals.auth.user.id))
    .orderBy(desc(purchase.createdAt));

  // newest first, so keep the first (most recent) name per ticker
  const companies = new Map<string, string>();
  for (const { ticker, companyName } of rows)
    if (!companies.has(ticker)) companies.set(ticker, companyName);

  // `?ticker=AAPL` pre-fills the form, e.g. from a company's page

  return {
    companies,
    ticker: parseTicker(url.searchParams.get("ticker")),
    ...definePageMetaTags({
      title: "Add purchase",
      description: "Record shares you've bought.",
    }),
  };
};
