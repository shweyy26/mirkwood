import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  boolean,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const readStatusEnum = pgEnum("read_status", [
  "tbr",
  "reading",
  "finished",
  "dnf",
]);

export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  totalPages: integer("total_pages"),
  genre: text("genre"),
  coverUrl: text("cover_url"),
  isbn: text("isbn"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const readEntries = pgTable("read_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  status: readStatusEnum("status").notNull().default("tbr"),
  isReread: boolean("is_reread").notNull().default(false),
  currentPage: integer("current_page").notNull().default(0),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  rating: integer("rating"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name"),
  pagesPerHour: integer("pages_per_hour").notNull().default(40),
  weekdayHours: real("weekday_hours").notNull().default(1),
  weekendHours: real("weekend_hours").notNull().default(3),
  yearlyGoal: integer("yearly_goal"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const booksRelations = relations(books, ({ many }) => ({
  readEntries: many(readEntries),
}));

export const readEntriesRelations = relations(readEntries, ({ one }) => ({
  book: one(books, {
    fields: [readEntries.bookId],
    references: [books.id],
  }),
}));

export type Book = typeof books.$inferSelect;
export type ReadEntry = typeof readEntries.$inferSelect;
export type Settings = typeof settings.$inferSelect;
