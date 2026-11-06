import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { DATABASE_URL } from "$app/env/private";
import * as schema from "./schema";

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

/**
 * Vite re-runs this module on every dev reload, which would open a new
 * connection pool each time until Postgres runs out. Keeping the client on
 * `globalThis` means one pool for the life of the process.
 */
const globalForDb = globalThis as typeof globalThis & { stockySql?: SQL };

const client = (globalForDb.stockySql ??= new SQL(DATABASE_URL));

export const db = drizzle({ client, schema });
