import { redirect } from "@sveltejs/kit";
import { definePageMetaTags } from "svelte-meta-tags";
import { auth } from "#lib/server/auth.js";
import { loadPortfolio } from "#lib/server/portfolio.js";
import type { Actions, PageServerLoad } from "./$types";

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

export const actions: Actions = {
  signOut: async ({ request }) => {
    await auth.api.signOut({ headers: request.headers });
    redirect(303, "/login");
  },
};
