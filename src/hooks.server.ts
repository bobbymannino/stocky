import type { Handle } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import {
  DEFAULT_PREFERENCES,
  themeAttributes,
  type ThemePreferences,
} from "#lib/preferences.js";
import { auth } from "#lib/server/auth.js";
import { loadPreferences } from "#lib/server/preferences.js";
import { building } from "$app/env";

export const handle: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });

  event.locals.auth = session
    ? {
        user: session.user,
        session: session.session,
      }
    : null;

  // only full page loads render <html>; data and API requests skip the lookup
  const theme: ThemePreferences =
    session && event.request.headers.get("accept")?.includes("text/html")
      ? await loadPreferences(session.user.id)
      : DEFAULT_PREFERENCES;

  return svelteKitHandler({
    event,
    // themed on the server, so the page never flashes the wrong colours
    resolve: (e) =>
      resolve(e, {
        transformPageChunk: ({ html }) =>
          html.replace("%theme%", themeHtml(theme)),
      }),
    auth,
    building,
  });
};

function themeHtml(theme: ThemePreferences) {
  return Object.entries(themeAttributes(theme))
    .map(([name, value]) => `${name}="${value}"`)
    .join(" ");
}
