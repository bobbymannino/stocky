CREATE TABLE "dividend" (
	"ticker" text NOT NULL,
	"ex_date" date NOT NULL,
	"amount" numeric(18, 6) NOT NULL,
	"quoted_amount" numeric(18, 6) NOT NULL,
	"currency" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dividend_ticker_ex_date_pk" PRIMARY KEY("ticker","ex_date")
);
--> statement-breakpoint
CREATE TABLE "dividend_fetch" (
	"ticker" text PRIMARY KEY NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
