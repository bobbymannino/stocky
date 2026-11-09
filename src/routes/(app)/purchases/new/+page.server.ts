import { redirect } from "@sveltejs/kit";
import { definePageMetaTags } from "svelte-meta-tags";
import { loadCompanyNames } from "#lib/server/portfolio.js";
import { parseTicker } from "#lib/ticker.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.auth) redirect(303, "/login");

  return {
    // auto-fills company names in the form
    companies: await loadCompanyNames(locals.auth.user.id),
    // `?ticker=AAPL` pre-fills the form, e.g. from a company's page
    ticker: parseTicker(url.searchParams.get("ticker")),
    ...definePageMetaTags({
      title: "Add purchase",
      description: "Record shares you've bought.",
    }),
  };
};
