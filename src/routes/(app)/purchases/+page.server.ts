import { redirect } from "@sveltejs/kit";
import { definePageMetaTags } from "svelte-meta-tags";
import { loginUrl } from "#lib/server/login-redirect.js";
import { loadPortfolio } from "#lib/server/portfolio.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.auth) redirect(303, loginUrl(url));

  return {
    ...(await loadPortfolio(locals.auth.user.id)),
    ...definePageMetaTags({
      title: "Purchases",
      description: "Every share purchase you've recorded.",
    }),
  };
};
