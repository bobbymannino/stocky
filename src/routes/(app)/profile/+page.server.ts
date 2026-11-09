import { redirect } from "@sveltejs/kit";
import { and, countDistinct, count, eq, isNull } from "drizzle-orm";
import { definePageMetaTags } from "svelte-meta-tags";
import { auth } from "#lib/server/auth.js";
import { db } from "#lib/server/db/index.js";
import { purchase } from "#lib/server/db/schema.js";
import { loginUrl } from "#lib/server/login-redirect.js";
import type { Actions, PageServerLoad } from "./$types";

// the user's details come from the (app) layout; this adds a few totals
export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.auth) redirect(303, loginUrl(url));

  const [totals] = await db
    .select({
      purchases: count(),
      companies: countDistinct(purchase.ticker),
    })
    .from(purchase)
    .where(
      and(
        eq(purchase.userId, locals.auth.user.id),
        isNull(purchase.archivedAt),
      ),
    );

  return {
    totals,
    ...definePageMetaTags({
      title: "Profile",
      description: "Your Stocky account details.",
    }),
  };
};

export const actions: Actions = {
  signOut: async ({ request }) => {
    await auth.api.signOut({ headers: request.headers });
    redirect(303, "/login");
  },
};
