import { eq } from "drizzle-orm";
import { DEFAULT_PREFERENCES, type Preferences } from "#lib/preferences.js";
import { db } from "#lib/server/db/index.js";
import { userPreference } from "#lib/server/db/schema.js";

/** The user's preferences, with defaults for anything they haven't set. */
export async function loadPreferences(userId: string): Promise<Preferences> {
  const [row] = await db
    .select({ currencyMode: userPreference.currencyMode })
    .from(userPreference)
    .where(eq(userPreference.userId, userId));
  return { ...DEFAULT_PREFERENCES, ...row };
}
