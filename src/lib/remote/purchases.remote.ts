import { error, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";
import { ensureCompanyColors } from "#lib/server/company-colors.js";
import { db } from "#lib/server/db/index.js";
import { purchase } from "#lib/server/db/schema.js";
import { command, form, getRequestEvent } from "$app/server";

const positiveNumber = (label: string) =>
  v.pipe(
    v.number(`${label} must be a number`),
    v.finite(`${label} must be a number`),
    v.gtValue(0, `${label} must be greater than 0`),
  );

const AddPurchaseSchema = v.object({
  ticker: v.pipe(
    v.string(),
    v.trim(),
    v.toUpperCase(),
    v.nonEmpty("Ticker is required"),
    v.maxLength(10, "Ticker is too long"),
    v.regex(
      /^[A-Z0-9.-]+$/,
      "Ticker can only contain letters, numbers, . and -",
    ),
  ),
  companyName: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Company is required"),
    v.maxLength(200, "Company name is too long"),
  ),
  boughtAt: v.pipe(
    v.string(),
    v.isoDate("Enter a valid date"),
    // the user's "today" can be up to a day ahead of the server's UTC date
    v.check((d) => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      return d <= tomorrow.toISOString().slice(0, 10);
    }, "Date can't be in the future"),
  ),
  pricePerShare: positiveNumber("Price"),
  shares: positiveNumber("Shares"),
});

export const addPurchase = form(AddPurchaseSchema, async (data) => {
  const { locals } = getRequestEvent();
  if (!locals.auth) redirect(303, "/login");

  await db.insert(purchase).values({
    userId: locals.auth.user.id,
    ticker: data.ticker,
    companyName: data.companyName,
    boughtAt: data.boughtAt,
    // numeric columns take strings to keep precision
    pricePerShare: String(data.pricePerShare),
    shares: String(data.shares),
  });

  // a new company gets its colour now; existing ones keep theirs
  await ensureCompanyColors(locals.auth.user.id, [data.ticker]);

  // the client resets the form and navigates to the portfolio itself
});

export const deletePurchase = command(
  v.pipe(v.number(), v.integer(), v.minValue(1)),
  async (id) => {
    const { locals } = getRequestEvent();
    if (!locals.auth) error(401, "You need to be signed in");

    // scoped to the user so nobody can delete someone else's purchase by id
    const deleted = await db
      .delete(purchase)
      .where(and(eq(purchase.id, id), eq(purchase.userId, locals.auth.user.id)))
      .returning({ id: purchase.id });

    if (deleted.length === 0) error(404, "Purchase not found");
  },
);
