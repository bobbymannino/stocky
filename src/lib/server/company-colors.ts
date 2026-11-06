import { and, eq, inArray } from "drizzle-orm";
import {
  COMPANY_COLORS,
  randomCompanyColor,
  type CompanyColor,
  type CompanyColors,
} from "#lib/company-colors.js";
import { db } from "#lib/server/db/index.js";
import { companyColor } from "#lib/server/db/schema.js";

function isCompanyColor(value: string): value is CompanyColor {
  return (COMPANY_COLORS as readonly string[]).includes(value);
}

/**
 * Returns each ticker's saved colour, giving any ticker that doesn't have one
 * a random colour first. Safe to call concurrently: existing colours are kept.
 */
export async function ensureCompanyColors(
  userId: string,
  tickers: string[],
): Promise<CompanyColors> {
  const unique = [...new Set(tickers)];
  if (unique.length === 0) return {};

  const where = and(
    eq(companyColor.userId, userId),
    inArray(companyColor.ticker, unique),
  );

  let rows = await db.select().from(companyColor).where(where);

  // colours removed from the palette (e.g. ones too close to red or green)
  // get a fresh one, so existing companies don't stay on them
  const retired = rows.filter((r) => !isCompanyColor(r.color));
  await Promise.all(
    retired.map((r) =>
      db
        .update(companyColor)
        .set({ color: randomCompanyColor() })
        .where(
          and(
            eq(companyColor.userId, userId),
            eq(companyColor.ticker, r.ticker),
            // only if still retired, so concurrent requests don't both reroll it
            eq(companyColor.color, r.color),
          ),
        ),
    ),
  );

  const missing = unique.filter((t) => !rows.some((r) => r.ticker === t));
  if (missing.length > 0) {
    await db
      .insert(companyColor)
      .values(
        missing.map((ticker) => ({
          userId,
          ticker,
          color: randomCompanyColor(),
        })),
      )
      .onConflictDoNothing();
  }

  if (missing.length > 0 || retired.length > 0)
    rows = await db.select().from(companyColor).where(where);

  const colors: CompanyColors = {};
  for (const r of rows) if (isCompanyColor(r.color)) colors[r.ticker] = r.color;
  return colors;
}
