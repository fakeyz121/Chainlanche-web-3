import { pgTable, serial, text, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  avatarUrl: text("avatar_url"),
  walletAddress: text("wallet_address"),
  isSuspended: boolean("is_suspended").notNull().default(false),
  chainCoinBalance: numeric("chain_coin_balance", { precision: 18, scale: 4 }).notNull().default("0"),
  level: integer("level").default(1),
  trustScore: numeric("trust_score", { precision: 5, scale: 2 }).default("100"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
