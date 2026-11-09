import { fail, redirect } from "@sveltejs/kit";
import { APIError } from "better-auth/api";
import { definePageMetaTags } from "svelte-meta-tags";
import { auth } from "#lib/server/auth.js";
import { safeRedirectTo } from "#lib/server/login-redirect.js";
import {
  loadSharedCompanyName,
  OG_HEIGHT,
  OG_WIDTH,
} from "#lib/server/og-image.js";
import { parseTicker } from "#lib/ticker.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  const redirectTo = safeRedirectTo(url.searchParams.get("redirectTo"));
  if (locals.auth) redirect(303, redirectTo);

  return {
    redirectTo,
    // link previews can't sign in, so a shared holding's link lands here:
    // show that holding's card instead of a plain sign-in page
    ...((await holdingMetaTags(redirectTo, url.origin)) ??
      definePageMetaTags({
        title: "Sign in",
        description: "Sign in or create a Stocky account.",
      })),
  };
};

/** Preview tags for `/holdings/<ticker>`, or undefined for any other path. */
async function holdingMetaTags(path: string, origin: string) {
  const match = /^\/holdings\/([^/?#]+)\/?(?:[?#]|$)/.exec(path);
  const ticker = match && parseTicker(decodeURIComponent(match[1]));
  if (!ticker) return undefined;

  const companyName = await loadSharedCompanyName(ticker);
  const name = companyName ? `${ticker} (${companyName})` : ticker;
  return definePageMetaTags({
    title: ticker,
    description: `Price history for ${name} on Stocky.`,
    openGraph: {
      url: new URL(`/holdings/${encodeURIComponent(ticker)}`, origin).href,
      images: [
        {
          url: new URL(`/holdings/${encodeURIComponent(ticker)}/og.png`, origin)
            .href,
          width: OG_WIDTH,
          height: OG_HEIGHT,
          alt: `${ticker} price over time`,
        },
      ],
    },
    twitter: { cardType: "summary_large_image" },
  });
}

export const actions: Actions = {
  signIn: async ({ request }) => {
    const data = await request.formData();
    const redirectTo = safeRedirectTo(String(data.get("redirectTo") ?? ""));
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    try {
      await auth.api.signInEmail({ body: { email, password } });
    } catch (e) {
      if (e instanceof APIError)
        return fail(400, { email, message: e.message });
      throw e;
    }
    redirect(303, redirectTo);
  },
  signUp: async ({ request }) => {
    const data = await request.formData();
    const redirectTo = safeRedirectTo(String(data.get("redirectTo") ?? ""));
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "") || email.split("@")[0];

    try {
      await auth.api.signUpEmail({ body: { email, password, name } });
    } catch (e) {
      if (e instanceof APIError)
        return fail(400, { email, message: e.message });
      throw e;
    }
    redirect(303, redirectTo);
  },
};
