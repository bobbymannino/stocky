import { redirect } from "@sveltejs/kit";
import { definePageMetaTags } from "svelte-meta-tags";
import { loginUrl } from "#lib/server/login-redirect.js";
import { parseTicker } from "#lib/ticker.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals, url }) => {
  if (!locals.auth) redirect(303, loginUrl(url));

  // the search form submits here with `?ticker=`; a valid one goes to its page
  const query = url.searchParams.get("ticker");
  const ticker = parseTicker(query);
  if (ticker) redirect(303, `/holdings/${encodeURIComponent(ticker)}`);

  return {
    query: query ?? "",
    invalid: query !== null && query.trim() !== "",
    ...definePageMetaTags({
      title: "Search",
      description: "Look up a company by its ticker.",
    }),
  };
};
