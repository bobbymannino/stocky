import type { purchase } from "#lib/server/db/schema.js";

export type Purchase = typeof purchase.$inferSelect;

/** Tax charged on each purchase, as a fraction of the total. */
export const TAX_RATE = 0.005;

/** Price/share maths for a purchase. Numeric columns arrive as strings. */
export function purchaseCosts(p: Pick<Purchase, "pricePerShare" | "shares">) {
  const price = Number(p.pricePerShare);
  const shares = Number(p.shares);
  const total = price * shares;
  const tax = total * TAX_RATE;
  return { price, shares, total, tax, totalIncTax: total + tax };
}
