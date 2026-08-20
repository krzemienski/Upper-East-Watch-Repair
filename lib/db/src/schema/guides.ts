import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const guidesTable = pgTable("guides", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  title: varchar("title", { length: 240 }).notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  author: varchar("author", { length: 120 })
    .notNull()
    .default("Upper East Watch Repair"),
  status: varchar("status", { length: 20 })
    .$type<"draft" | "published">()
    .notNull()
    .default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  metaDescription: varchar("meta_description", { length: 160 }).notNull(),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertGuideSchema = createInsertSchema(guidesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertGuide = z.infer<typeof insertGuideSchema>;
export type Guide = typeof guidesTable.$inferSelect;