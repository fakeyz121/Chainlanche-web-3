import { Router, type IRouter } from "express";
import { db, usersTable, transactionsTable, topupRequestsTable, escrowTable, ordersTable } from "@workspace/db";
import { eq, sql, inArray } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/authenticate";
import {
  ListTransactionsQueryParams,
  RequestTopupBody,
  ListTopupRequestsQueryParams,
  ApproveTopupParams,
  ApproveTopupBody,
  RequestWithdrawBody,
  TransferCoinsBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatTx(t: typeof transactionsTable.$inferSelect) {
  return {
    id: t.id, userId: t.userId, type: t.type, amount: Number(t.amount),
    status: t.status, txHash: t.txHash, description: t.description,
    createdAt: t.createdAt.toISOString(),
  };
}

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id, username: u.username, email: u.email, role: u.role, avatarUrl: u.avatarUrl,
    walletAddress: u.walletAddress, isSuspended: u.isSuspended,
    chainCoinBalance: Number(u.chainCoinBalance), level: u.level,
    trustScore: u.trustScore ? Number(u.trustScore) : null, createdAt: u.createdAt.toISOString(),
  };
}

router.get("/wallet/balance", authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Calculate locked in escrow
  const userOrders = await db.select({ id: ordersTable.id }).from(ordersTable)
    .where(sql`${ordersTable.clientId} = ${req.user!.id} AND ${ordersTable.status} = 'in_progress'`);
  const orderIds = userOrders.map(o => o.id);
  let lockedInEscrow = 0;
  if (orderIds.length > 0) {
    const escrows = await db.select().from(escrowTable)
      .where(sql`${escrowTable.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)}) AND ${escrowTable.status} = 'held'`);
    lockedInEscrow = escrows.reduce((acc, e) => acc + Number(e.amount), 0);
  }

  res.json({
    chainCoin: Number(user.chainCoinBalance),
    usdEquivalent: Number(user.chainCoinBalance) * 1.0,
    lockedInEscrow,
    walletAddress: user.walletAddress,
  });
});

router.get("/wallet/transactions", authenticate, async (req, res): Promise<void> => {
  const params = ListTransactionsQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;

  const txs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, req.user!.id))
    .limit(limit).offset((page - 1) * limit);

  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(transactionsTable).where(eq(transactionsTable.userId, req.user!.id));

  res.json({ transactions: txs.map(formatTx), total: Number(countResult.count) });
});

router.post("/wallet/topup", authenticate, async (req, res): Promise<void> => {
  const body = RequestTopupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [topup] = await db.insert(topupRequestsTable).values({
    userId: req.user!.id,
    amount: String(body.data.amount),
    txHash: body.data.txHash,
    paymentMethod: body.data.paymentMethod,
    network: body.data.network,
    status: "pending",
  }).returning();

  res.status(201).json({
    id: topup.id, userId: topup.userId, amount: Number(topup.amount),
    txHash: topup.txHash, paymentMethod: topup.paymentMethod, network: topup.network,
    status: topup.status, adminNote: topup.adminNote, createdAt: topup.createdAt.toISOString(),
  });
});

router.get("/wallet/topup/list", authenticate, async (req, res): Promise<void> => {
  const params = ListTopupRequestsQueryParams.safeParse(req.query);
  const status = params.success ? params.data.status : undefined;

  let query = db.select().from(topupRequestsTable).$dynamic();
  if (req.user!.role !== "admin") {
    query = query.where(eq(topupRequestsTable.userId, req.user!.id));
  } else if (status) {
    query = query.where(eq(topupRequestsTable.status, status));
  }

  const rows = await query;
  const userIds = [...new Set(rows.map(r => r.userId))];
  const users = userIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  res.json(rows.map(t => ({
    id: t.id, userId: t.userId, user: userMap[t.userId] ? formatUser(userMap[t.userId]) : undefined,
    amount: Number(t.amount), txHash: t.txHash, paymentMethod: t.paymentMethod,
    network: t.network, status: t.status, adminNote: t.adminNote, createdAt: t.createdAt.toISOString(),
  })));
});

router.patch("/wallet/topup/:id/approve", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const body = ApproveTopupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [topup] = await db.update(topupRequestsTable)
    .set({ status: body.data.status, adminNote: body.data.adminNote })
    .where(eq(topupRequestsTable.id, id))
    .returning();

  if (!topup) {
    res.status(404).json({ error: "Topup request not found" });
    return;
  }

  if (body.data.status === "approved") {
    await db.update(usersTable)
      .set({ chainCoinBalance: sql`${usersTable.chainCoinBalance} + ${String(topup.amount)}` })
      .where(eq(usersTable.id, topup.userId));

    await db.insert(transactionsTable).values({
      userId: topup.userId,
      type: "topup",
      amount: String(topup.amount),
      status: "completed",
      txHash: topup.txHash,
      description: `Top-up via ${topup.paymentMethod}`,
    });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, topup.userId));
  res.json({
    id: topup.id, userId: topup.userId, user: user ? formatUser(user) : undefined,
    amount: Number(topup.amount), txHash: topup.txHash, paymentMethod: topup.paymentMethod,
    network: topup.network, status: topup.status, adminNote: topup.adminNote,
    createdAt: topup.createdAt.toISOString(),
  });
});

router.post("/wallet/withdraw", authenticate, async (req, res): Promise<void> => {
  const body = RequestWithdrawBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (Number(user.chainCoinBalance) < body.data.amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }
  await db.update(usersTable)
    .set({ chainCoinBalance: sql`${usersTable.chainCoinBalance} - ${String(body.data.amount)}` })
    .where(eq(usersTable.id, req.user!.id));

  const [tx] = await db.insert(transactionsTable).values({
    userId: req.user!.id,
    type: "withdraw",
    amount: String(body.data.amount),
    status: "pending",
    description: `Withdraw to ${body.data.walletAddress} on ${body.data.network}`,
  }).returning();

  res.status(201).json(formatTx(tx));
});

router.post("/wallet/transfer", authenticate, async (req, res): Promise<void> => {
  const body = TransferCoinsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (Number(user.chainCoinBalance) < body.data.amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }
  const [recipient] = await db.select().from(usersTable).where(eq(usersTable.id, body.data.toUserId));
  if (!recipient) {
    res.status(404).json({ error: "Recipient not found" });
    return;
  }
  await db.update(usersTable)
    .set({ chainCoinBalance: sql`${usersTable.chainCoinBalance} - ${String(body.data.amount)}` })
    .where(eq(usersTable.id, req.user!.id));
  await db.update(usersTable)
    .set({ chainCoinBalance: sql`${usersTable.chainCoinBalance} + ${String(body.data.amount)}` })
    .where(eq(usersTable.id, body.data.toUserId));

  const [tx] = await db.insert(transactionsTable).values({
    userId: req.user!.id,
    type: "transfer",
    amount: String(body.data.amount),
    status: "completed",
    description: body.data.note ?? `Transfer to @${recipient.username}`,
  }).returning();

  res.json(formatTx(tx));
});

export default router;
