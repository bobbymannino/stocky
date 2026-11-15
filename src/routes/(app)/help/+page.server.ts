import { redirect } from "@sveltejs/kit";
import { definePageMetaTags } from "svelte-meta-tags";
import { loginUrl } from "#lib/server/login-redirect.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.auth) redirect(303, loginUrl(url));

  return {
    ...definePageMetaTags({
      title: "Help",
      description: "Find useful help and advice on how to use Stocky.",
    }),
  };
};
