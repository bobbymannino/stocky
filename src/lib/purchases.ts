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

/**
 * Totals across every holding. Value and gain only count tickers with a saved
 * price, so `cost` there is what those priced tickers cost, and `unpriced`
 * says how many tickers were left out.
 */
export function holdingsSummary(
  purchases: Pick<Purchase, "ticker" | "pricePerShare" | "shares">[],
  prices: Record<string, number | undefined>,
) {
  const byTicker = new Map<string, { shares: number; cost: number }>();
  for (const p of purchases) {
    const { shares, totalIncTax } = purchaseCosts(p);
    const h = byTicker.get(p.ticker) ?? { shares: 0, cost: 0 };
    h.shares += shares;
    h.cost += totalIncTax;
    byTicker.set(p.ticker, h);
  }

  let invested = 0;
  let pricedCost = 0;
  let value = 0;
  let unpriced = 0;
  for (const [ticker, h] of byTicker) {
    invested += h.cost;
    const price = prices[ticker];
    if (price === undefined) {
      unpriced++;
      continue;
    }
    pricedCost += h.cost;
    value += price * h.shares;
  }

  const priced = byTicker.size - unpriced;
  return {
    /** total paid, including tax, across every holding */
    invested,
    /** current value of the priced holdings, or undefined if none are priced */
    value: priced > 0 ? value : undefined,
    /** value minus what the priced holdings cost */
    gain: priced > 0 ? value - pricedCost : undefined,
    /** gain as a fraction of what the priced holdings cost */
    gainPercent:
      priced > 0 && pricedCost > 0
        ? (value - pricedCost) / pricedCost
        : undefined,
    holdings: byTicker.size,
    unpriced,
  };
}
