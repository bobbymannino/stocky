import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from "$app/env/private";
import { getRequestEvent } from "$app/server";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      // input: false, so nobody can make themselves a VIP when signing up
      vipSince: { type: "date", required: false, input: false },
    },
  },
  // must be last so it can set cookies from server actions / remote functions
  plugins: [sveltekitCookies(getRequestEvent)],
});

export type Session = typeof auth.$Infer.Session;
