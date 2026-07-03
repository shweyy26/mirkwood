ALTER TABLE "series" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "series" CASCADE;--> statement-breakpoint
ALTER TABLE "books" DROP CONSTRAINT "books_series_id_series_id_fk";
--> statement-breakpoint
ALTER TABLE "books" DROP COLUMN "series_id";--> statement-breakpoint
ALTER TABLE "books" DROP COLUMN "series_index";