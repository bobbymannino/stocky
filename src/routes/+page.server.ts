import { fail, redirect } from "@sveltejs/kit";
import { desc, eq } from "drizzle-orm";
import { definePageMetaTags } from "svelte-meta-tags";
import { auth } from "#lib/server/auth.js";
import { db } from "#lib/server/db/index.js";
import { purchase } from "#lib/server/db/schema.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.auth) redirect(303, "/login");

  const purchases = await db
    .select()
    .from(purchase)
    .where(eq(purchase.userId, locals.auth.user.id))
    .orderBy(desc(purchase.boughtAt), desc(purchase.createdAt));

  return {
    user: locals.auth.user,
    purchases,
    ...definePageMetaTags({
      title: "Portfolio",
      description: "Your recorded share purchases.",
    }),
  };
};

const DECIMAL = /^\d+(\.\d+)?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const actions: Actions = {
  addPurchase: async ({ request, locals }) => {
    if (!locals.auth) redirect(303, "/login");

    const data = await request.formData();
    const values = {
      ticker: String(data.get("ticker") ?? "")
        .trim()
        .toUpperCase(),
      companyName: String(data.get("companyName") ?? "").trim(),
      boughtAt: String(data.get("boughtAt") ?? ""),
      pricePerShare: String(data.get("pricePerShare") ?? "").trim(),
      shares: String(data.get("shares") ?? "").trim(),
    };

    if (!values.ticker || !values.companyName)
      return fail(400, { values, message: "Ticker and company are required." });
    if (!DATE.test(values.boughtAt) || new Date(values.boughtAt) > new Date())
      return fail(400, { values, message: "Enter a valid purchase date." });
    if (
      !DECIMAL.test(values.pricePerShare) ||
      Number(values.pricePerShare) <= 0
    )
      return fail(400, { values, message: "Price must be a positive number." });
    if (!DECIMAL.test(values.shares) || Number(values.shares) <= 0)
      return fail(400, {
        values,
        message: "Shares must be a positive number.",
      });

    await db
      .insert(purchase)
      .values({ ...values, userId: locals.auth.user.id });

    return { success: true };
  },
  signOut: async ({ request }) => {
    await auth.api.signOut({ headers: request.headers });
    redirect(303, "/login");
  },
};
