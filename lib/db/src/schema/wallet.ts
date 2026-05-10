import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 18, scale: 4 }).notNull(),
  status: text("status").notNull().default("completed"),
  txHash: text("tx_hash"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const topupRequestsTable = pgTable("topup_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  amount: numeric("amount", { precision: 18, scale: 4 }).notNull(),
  txHash: text("tx_hash").notNull(),
  paymentMethod: text("payment_method").notNull(),
  network: text("network"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export const insertTopupRequestSchema = createInsertSchema(topupRequestsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertTopupRequest = z.infer<typeof insertTopupRequestSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
export type TopupRequest = typeof topupRequestsTable.$inferSelect;
