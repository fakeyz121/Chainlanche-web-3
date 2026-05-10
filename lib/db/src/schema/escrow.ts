import { pgTable, serial, integer, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const escrowTable = pgTable("escrow", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("held"),
  releasedAt: timestamp("released_at"),
  disputeReason: text("dispute_reason"),
  txHash: text("tx_hash"),
  milestones: jsonb("milestones").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEscrowSchema = createInsertSchema(escrowTable).omit({ id: true, createdAt: true });
export type InsertEscrow = z.infer<typeof insertEscrowSchema>;
export type Escrow = typeof escrowTable.$inferSelect;
