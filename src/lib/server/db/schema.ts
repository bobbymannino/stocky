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
  boolean,
} from "drizzle-orm/pg-core";
import { CURRENCY_MODES } from "../../preferences";
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
    /**
     * A pretend trade the user is watching. Wishlist purchases are shown on
     * their own and never count towards holdings or portfolio totals.
     */
    wishlist: boolean("wishlist").notNull().default(false),
    /** Set when the user deletes the purchase; archived rows are hidden from them. */
    archivedAt: timestamp("archived_at", { withTimezone: true }),
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

/** The latest price per share a user has set for each company (ticker). */
export const currentPrice = pgTable(
  "current_price",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ticker: text("ticker").notNull(),
    /** Price per share in GBP. */
    price: numeric("price", { precision: 18, scale: 4 }).notNull(),
    /** Where the price came from: typed in by the user, or fetched live. */
    source: text("source", { enum: ["manual", "finnhub", "yahoo"] }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.ticker] })],
);

/**
 * Every live price fetched by anyone, kept as a shared price history. Not tied
 * to a user. Nothing reads it yet.
 *
 * Append-only: database triggers (migration `0005_price_quote_immutable`)
 * reject any UPDATE, DELETE or TRUNCATE, so only ever insert into it.
 */
export const priceQuote = pgTable(
  "price_quote",
  {
    id: serial("id").primaryKey(),
    ticker: text("ticker").notNull(),
    /** Price per share converted to GBP, as shown to the user. */
    price: numeric("price", { precision: 18, scale: 4 }).notNull(),
    /** The price as the source quoted it, in `currency`. */
    quotedPrice: numeric("quoted_price", { precision: 18, scale: 4 }).notNull(),
    /** The source's currency code, e.g. `USD`, or `GBp` for London pence. */
    currency: text("currency").notNull(),
    source: text("source", { enum: ["finnhub", "yahoo"] }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("price_quote_ticker_fetchedAt_idx").on(table.ticker, table.fetchedAt),
  ],
);

/** Each user's settings; a missing row means all the defaults. */
export const userPreference = pgTable("user_preference", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** See `CURRENCY_MODES` in `#lib/preferences`. */
  currencyMode: text("currency_mode", { enum: CURRENCY_MODES })
    .notNull()
    .default("pence"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export * from "./auth.schema";
