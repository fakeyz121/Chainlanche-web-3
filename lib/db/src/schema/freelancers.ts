import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const freelancersTable = pgTable("freelancers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  bio: text("bio").notNull(),
  skills: text("skills").array().notNull().default([]),
  category: text("category").notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  portfolioItems: text("portfolio_items").array().notNull().default([]),
  completedOrders: integer("completed_orders").notNull().default(0),
  avgRating: numeric("avg_rating", { precision: 3, scale: 2 }),
  totalEarnings: numeric("total_earnings", { precision: 18, scale: 4 }).notNull().default("0"),
  level: integer("level").default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFreelancerSchema = createInsertSchema(freelancersTable).omit({ id: true, createdAt: true });
export type InsertFreelancer = z.infer<typeof insertFreelancerSchema>;
export type Freelancer = typeof freelancersTable.$inferSelect;
