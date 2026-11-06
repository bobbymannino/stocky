import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  DATABASE_URL: { description: "The database connection string." },
  BETTER_AUTH_SECRET: {
    description: "Secret used by Better Auth to sign sessions (min 32 chars).",
  },
  BETTER_AUTH_URL: {
    description: "The base URL of the app, e.g. http://localhost:5173.",
  },
  FINNHUB_TOKEN: {
    description:
      "Finnhub API key for current US share prices. Optional: without it, every live price comes from Yahoo.",
    schema: (value) => value || undefined,
  },
});
