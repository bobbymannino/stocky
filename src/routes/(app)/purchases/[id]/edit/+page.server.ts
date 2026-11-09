import { error, redirect } from "@sveltejs/kit";
import { and, eq, isNull } from "drizzle-orm";
import { definePageMetaTags } from "svelte-meta-tags";
import { db } from "#lib/server/db/index.js";
import { purchase } from "#lib/server/db/schema.js";
import { loginUrl } from "#lib/server/login-redirect.js";
import { loadCompanyNames } from "#lib/server/portfolio.js";
import type { PageServerLoad } from "./$types";

/** Only same-site paths, so `?from=` can't send anyone off to another site. */
function returnPath(from: string | null) {
  return from?.startsWith("/") && !from.startsWith("//") && !from.includes("\\")
    ? from
    : "/purchases";
}

export const load: PageServerLoad = async ({ locals, params, url }) => {
  if (!locals.auth) redirect(303, loginUrl(url));
  const userId = locals.auth.user.id;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) error(404, "Purchase not found");

  // scoped to the user, so other people's purchases look like they don't exist
  const [found] = await db
    .select()
    .from(purchase)
    .where(
      and(
        eq(purchase.id, id),
        eq(purchase.userId, userId),
        isNull(purchase.archivedAt),
      ),
    );
  if (!found) error(404, "Purchase not found");

  return {
    purchase: found,
    companies: await loadCompanyNames(userId),
    returnTo: returnPath(url.searchParams.get("from")),
    ...definePageMetaTags({
      title: `Edit ${found.ticker} purchase`,
      description: "Correct the details of a purchase.",
    }),
  };
};
