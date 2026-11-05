import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  date,
  numeric,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export const task = pgTable("task", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  priority: integer("priority").notNull().default(1),
});

/** A purchase of shares recorded by a user. */
export const purchase = pgTable(
  "purchase",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** When the row was added to the app. */
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    /** When the shares were actually bought (YYYY-MM-DD). */
    boughtAt: date("bought_at", { mode: "string" }).notNull(),
    ticker: text("ticker").notNull(),
    companyName: text("company_name").notNull(),
    // numeric is returned as a string to avoid float rounding on money
    pricePerShare: numeric("price_per_share", {
      precision: 18,
      scale: 4,
    }).notNull(),
    // allows fractional shares
    shares: numeric("shares", { precision: 18, scale: 6 }).notNull(),
  },
  (table) => [index("purchase_userId_idx").on(table.userId)],
);

export const purchaseRelations = relations(purchase, ({ one }) => ({
  user: one(user, { fields: [purchase.userId], references: [user.id] }),
}));

/** A user's accent colour for each company (ticker) they hold. */
export const companyColor = pgTable(
  "company_color",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    /** A Catppuccin palette name, see `COMPANY_COLORS` in `#lib/company-colors` */
    color: text("color").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.ticker] })],
);

export * from "./auth.schema";
