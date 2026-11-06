CREATE TABLE "current_price" (
	"user_id" text NOT NULL,
	"ticker" text NOT NULL,
	"price" numeric(18, 4) NOT NULL,
	"source" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "current_price_user_id_ticker_pk" PRIMARY KEY("user_id","ticker")
);
--> statement-breakpoint
ALTER TABLE "current_price" ADD CONSTRAINT "current_price_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;