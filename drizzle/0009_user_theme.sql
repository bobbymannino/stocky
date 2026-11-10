ALTER TABLE "user_preference" ADD COLUMN "appearance" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "light_theme" text DEFAULT 'latte' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "dark_theme" text DEFAULT 'mocha' NOT NULL;