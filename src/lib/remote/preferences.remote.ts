import { error } from "@sveltejs/kit";
import * as v from "valibot";
import {
  APPEARANCES,
  CURRENCY_MODES,
  DARK_THEMES,
  LIGHT_THEMES,
} from "#lib/preferences.js";
import { db } from "#lib/server/db/index.js";
import { userPreference } from "#lib/server/db/schema.js";
import { command, getRequestEvent } from "$app/server";

/** Saves how the user wants amounts of money written. */
export const setCurrencyMode = command(
  v.picklist(CURRENCY_MODES),
  async (currencyMode) => savePreferences({ currencyMode }),
);

/** Saves any of the user's appearance, light theme and dark theme. */
export const setThemePreferences = command(
  v.partial(
    v.object({
      appearance: v.picklist(APPEARANCES),
      lightTheme: v.picklist(LIGHT_THEMES),
      darkTheme: v.picklist(DARK_THEMES),
    }),
  ),
  async (theme) => savePreferences(theme),
);

/** Upserts the signed-in user's preference row with `changes`. */
async function savePreferences(
  changes: Partial<typeof userPreference.$inferInsert>,
) {
  const { locals } = getRequestEvent();
  if (!locals.auth) error(401, "You need to be signed in");

  const values = { ...changes, updatedAt: new Date() };
  await db
    .insert(userPreference)
    .values({ ...values, userId: locals.auth.user.id })
    .onConflictDoUpdate({ target: userPreference.userId, set: values });
}
