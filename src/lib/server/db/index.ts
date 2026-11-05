import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { DATABASE_URL } from "$app/env/private";
import * as schema from "./schema";

if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = new SQL(DATABASE_URL);

export const db = drizzle({ client, schema });
