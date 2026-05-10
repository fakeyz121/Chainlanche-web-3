import { Router, type IRouter } from "express";
import { db, escrowTable, ordersTable, usersTable, freelancersTable } from "@workspace/db";
import { eq, sql, inArray } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import {
  ListEscrowQueryParams,
  GetEscrowParams,
  ReleaseEscrowParams,
  DisputeEscrowParams,
  DisputeEscrowBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatEscrow(e: typeof escrowTable.$inferSelect) {
  return {
    id: e.id, orderId: e.orderId, amount: Number(e.amount), status: e.status,
    releasedAt: e.releasedAt?.toISOString() ?? null, disputeReason: e.disputeReason,
    txHash: e.txHash, milestones: (e.milestones as unknown[]) ?? [], createdAt: e.createdAt.toISOString(),
  };
}

router.get("/escrow", authenticate, async (req, res): Promise<void> => {
  const params = ListEscrowQueryParams.safeParse(req.query);
  const status = params.success ? params.data.status : undefined;

  // Get all orders for this user
  const userOrders = await db.select({ id: ordersTable.id }).from(ordersTable)
    .where(sql`${ordersTable.clientId} = ${req.user!.id} OR ${ordersTable.freelancerId} = ${req.user!.id}`);
  const orderIds = userOrders.map(o => o.id);

  if (orderIds.length === 0) {
    res.json([]);
    return;
  }

  let escrows = await db.select().from(escrowTable)
    .where(inArray(escrowTable.orderId, orderIds));

  if (status) {
    escrows = escrows.filter(e => e.status === status);
  }

  res.json(escrows.map(formatEscrow));
});

router.get("/escrow/:id", authenticate, async (req, res): Promise<void> => {
  const params = GetEscrowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [e] = await db.select().from(escrowTable).where(eq(escrowTable.id, params.data.id));
  if (!e) {
    res.status(404).json({ error: "Escrow not found" });
    return;
  }
  res.json(formatEscrow(e));
});

router.post("/escrow/:id/release", authenticate, async (req, res): Promise<void> => {
  const params = ReleaseEscrowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [e] = await db.select().from(escrowTable).where(eq(escrowTable.id, params.data.id));
  if (!e) {
    res.status(404).json({ error: "Escrow not found" });
    return;
  }
  if (e.status !== "held") {
    res.status(400).json({ error: "Escrow not in held state" });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, e.orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  await db.update(escrowTable).set({ status: "released", releasedAt: new Date() }).where(eq(escrowTable.id, e.id));
  await db.update(ordersTable).set({ status: "completed", completedAt: new Date() }).where(eq(ordersTable.id, order.id));
  await db.update(usersTable)
    .set({ chainCoinBalance: sql`${usersTable.chainCoinBalance} + ${String(e.amount)}` })
    .where(eq(usersTable.id, order.freelancerId));
  await db.update(freelancersTable)
    .set({
      completedOrders: sql`${freelancersTable.completedOrders} + 1`,
      totalEarnings: sql`${freelancersTable.totalEarnings} + ${String(e.amount)}`,
    })
    .where(eq(freelancersTable.userId, order.freelancerId));

  const [updated] = await db.select().from(escrowTable).where(eq(escrowTable.id, e.id));
  res.json(formatEscrow(updated));
});

router.post("/escrow/:id/dispute", authenticate, async (req, res): Promise<void> => {
  const params = DisputeEscrowParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = DisputeEscrowBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [updated] = await db.update(escrowTable)
    .set({ status: "disputed", disputeReason: body.data.reason })
    .where(eq(escrowTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Escrow not found" });
    return;
  }
  res.json(formatEscrow(updated));
});

export default router;
