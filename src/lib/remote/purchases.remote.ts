import { redirect } from "@sveltejs/kit";
import * as v from "valibot";
import { db } from "#lib/server/db/index.js";
import { purchase } from "#lib/server/db/schema.js";
import { form, getRequestEvent } from "$app/server";

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
    v.check(
      (d) => d <= new Date().toISOString().slice(0, 10),
      "Date can't be in the future",
    ),
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

  // no explicit refresh, so SvelteKit re-runs the page's load and the list updates
});
