import { redirect } from "@sveltejs/kit";
import { and, desc, eq, isNull } from "drizzle-orm";
import { definePageMetaTags } from "svelte-meta-tags";
import { auth } from "#lib/server/auth.js";
import { ensureCompanyColors } from "#lib/server/company-colors.js";
import { db } from "#lib/server/db/index.js";
import { purchase } from "#lib/server/db/schema.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.auth) redirect(303, "/login");

  const purchases = await db
    .select()
    .from(purchase)
    .where(
      and(
        eq(purchase.userId, locals.auth.user.id),
        isNull(purchase.archivedAt),
      ),
    )
    .orderBy(desc(purchase.boughtAt), desc(purchase.createdAt));

  // also backfills colours for companies added before colours existed
  const colors = await ensureCompanyColors(
    locals.auth.user.id,
    purchases.map((p) => p.ticker),
  );

  return {
    user: locals.auth.user,
    purchases,
    colors,
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
