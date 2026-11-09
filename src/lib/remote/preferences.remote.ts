import { error } from "@sveltejs/kit";
import * as v from "valibot";
import { CURRENCY_MODES } from "#lib/preferences.js";
import { db } from "#lib/server/db/index.js";
import { userPreference } from "#lib/server/db/schema.js";
import { command, getRequestEvent } from "$app/server";

/** Saves how the user wants amounts of money written. */
export const setCurrencyMode = command(
  v.picklist(CURRENCY_MODES),
  async (currencyMode) => {
    const { locals } = getRequestEvent();
    if (!locals.auth) error(401, "You need to be signed in");

    const values = { currencyMode, updatedAt: new Date() };
    await db
      .insert(userPreference)
      .values({ userId: locals.auth.user.id, ...values })
      .onConflictDoUpdate({ target: userPreference.userId, set: values });
  },
);
