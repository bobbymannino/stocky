CREATE TABLE "price_quote" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" text NOT NULL,
	"price" numeric(18, 4) NOT NULL,
	"quoted_price" numeric(18, 4) NOT NULL,
	"currency" text NOT NULL,
	"source" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "price_quote_ticker_fetchedAt_idx" ON "price_quote" USING btree ("ticker","fetched_at");