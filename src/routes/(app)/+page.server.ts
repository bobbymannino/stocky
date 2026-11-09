import { redirect } from "@sveltejs/kit";
import { definePageMetaTags } from "svelte-meta-tags";
import { loadPortfolio } from "#lib/server/portfolio.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.auth) redirect(303, "/login");

  return {
    ...(await loadPortfolio(locals.auth.user.id)),
    ...definePageMetaTags({
      title: "Portfolio",
      description: "Your recorded share purchases.",
    }),
  };
};
