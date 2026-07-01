CREATE TYPE "public"."read_status" AS ENUM('tbr', 'reading', 'finished', 'dnf');--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"total_pages" integer,
	"genre" text,
	"cover_url" text,
	"series_id" uuid,
	"series_index" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "read_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"status" "read_status" DEFAULT 'tbr' NOT NULL,
	"is_reread" boolean DEFAULT false NOT NULL,
	"current_page" integer DEFAULT 0 NOT NULL,
	"start_date" date,
	"end_date" date,
	"rating" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "series_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"pages_per_hour" integer DEFAULT 40 NOT NULL,
	"weekday_hours" real DEFAULT 1 NOT NULL,
	"weekend_hours" real DEFAULT 3 NOT NULL,
	"yearly_goal" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "read_entries" ADD CONSTRAINT "read_entries_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;