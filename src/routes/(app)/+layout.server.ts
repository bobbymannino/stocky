import { redirect } from "@sveltejs/kit";
import { loginUrl } from "#lib/server/login-redirect.js";
import { loadPreferences } from "#lib/server/preferences.js";
import type { LayoutServerLoad } from "./$types";

// layout and page loads run in parallel, so each page load still guards itself
export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!locals.auth) redirect(303, loginUrl(url));

  return {
    user: locals.auth.user,
    preferences: await loadPreferences(locals.auth.user.id),
  };
};
