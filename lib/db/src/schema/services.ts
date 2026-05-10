import { pgTable, serial, integer, text, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { freelancersTable } from "./freelancers";

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  freelancerId: integer("freelancer_id").notNull().references(() => freelancersTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  deliveryDays: integer("delivery_days").notNull(),
  status: text("status").notNull().default("active"),
  thumbnailUrl: text("thumbnail_url"),
  previewImages: text("preview_images").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  totalOrders: integer("total_orders").notNull().default(0),
  avgRating: numeric("avg_rating", { precision: 3, scale: 2 }),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServiceSchema = createInsertSchema(servicesTable).omit({ id: true, createdAt: true });
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof servicesTable.$inferSelect;
