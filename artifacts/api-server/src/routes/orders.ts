import { Router, type IRouter } from "express";
import { db, ordersTable, servicesTable, freelancersTable, usersTable, escrowTable } from "@workspace/db";
import { eq, sql, and, inArray } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import {
  ListOrdersQueryParams,
  GetOrderParams,
  CreateOrderBody,
  UpdateOrderParams,
  UpdateOrderBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id, username: u.username, email: u.email, role: u.role,
    avatarUrl: u.avatarUrl, walletAddress: u.walletAddress, isSuspended: u.isSuspended,
    chainCoinBalance: Number(u.chainCoinBalance), level: u.level,
    trustScore: u.trustScore ? Number(u.trustScore) : null, createdAt: u.createdAt.toISOString(),
  };
}

function formatFreelancer(f: typeof freelancersTable.$inferSelect, user?: ReturnType<typeof formatUser>) {
  return {
    id: f.id, userId: f.userId, user, bio: f.bio, skills: f.skills, category: f.category,
    hourlyRate: Number(f.hourlyRate), status: f.status, portfolioItems: f.portfolioItems,
    completedOrders: f.completedOrders, avgRating: f.avgRating ? Number(f.avgRating) : null,
    totalEarnings: Number(f.totalEarnings), level: f.level, createdAt: f.createdAt.toISOString(),
  };
}

router.get("/orders", authenticate, async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const status = params.success ? params.data.status : undefined;
  const role = params.success ? params.data.role : undefined;

  const conditions = [];
  if (role === "client") {
    conditions.push(eq(ordersTable.clientId, req.user!.id));
  } else if (role === "freelancer") {
    conditions.push(eq(ordersTable.freelancerId, req.user!.id));
  } else {
    conditions.push(
      sql`(${ordersTable.clientId} = ${req.user!.id} OR ${ordersTable.freelancerId} = ${req.user!.id})`
    );
  }
  if (status) conditions.push(eq(ordersTable.status, status));

  const rows = await db.select().from(ordersTable)
    .where(and(...conditions))
    .limit(limit).offset((page - 1) * limit);

  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(ordersTable).where(and(...conditions));

  const allUserIds = [...new Set([
    ...rows.map(r => r.clientId),
    ...rows.map(r => r.freelancerId),
  ])];
  const users = allUserIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, allUserIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const flIds = [...new Set(rows.map(r => r.freelancerId))];
  const fls = flIds.length > 0
    ? await db.select().from(freelancersTable).where(inArray(freelancersTable.userId, flIds))
    : [];
  const flByUserId = Object.fromEntries(fls.map(f => [f.userId, f]));

  const svcIds = [...new Set(rows.map(r => r.serviceId))];
  const svcs = svcIds.length > 0
    ? await db.select().from(servicesTable).where(inArray(servicesTable.id, svcIds))
    : [];
  const svcMap = Object.fromEntries(svcs.map(s => [s.id, s]));

  const formatted = rows.map(o => {
    const client = userMap[o.clientId];
    const flUser = userMap[o.freelancerId];
    const fl = flByUserId[o.freelancerId];
    const svc = svcMap[o.serviceId];
    return {
      id: o.id, serviceId: o.serviceId,
      service: svc ? {
        id: svc.id, freelancerId: svc.freelancerId, title: svc.title, description: svc.description,
        category: svc.category, price: Number(svc.price), deliveryDays: svc.deliveryDays,
        status: svc.status, thumbnailUrl: svc.thumbnailUrl, previewImages: svc.previewImages,
        tags: svc.tags, totalOrders: svc.totalOrders, avgRating: svc.avgRating ? Number(svc.avgRating) : null,
        isFeatured: svc.isFeatured, createdAt: svc.createdAt.toISOString(),
      } : undefined,
      clientId: o.clientId, client: client ? formatUser(client) : undefined,
      freelancerId: o.freelancerId,
      freelancer: fl ? formatFreelancer(fl, flUser ? formatUser(flUser) : undefined) : undefined,
      amount: Number(o.amount), status: o.status, requirements: o.requirements,
      deliverables: o.deliverables, dueDate: o.dueDate?.toISOString() ?? null,
      completedAt: o.completedAt?.toISOString() ?? null, escrowId: o.escrowId,
      createdAt: o.createdAt.toISOString(),
    };
  });

  res.json({ orders: formatted, total: Number(countResult.count), page, limit });
});

router.post("/orders", authenticate, async (req, res): Promise<void> => {
  const body = CreateOrderBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [svc] = await db.select().from(servicesTable).where(eq(servicesTable.id, body.data.serviceId));
  if (!svc) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  const [fl] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, svc.freelancerId));
  if (!fl) {
    res.status(404).json({ error: "Freelancer not found" });
    return;
  }

  // Check client has enough balance
  const [clientUser] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (Number(clientUser.chainCoinBalance) < Number(svc.price)) {
    res.status(400).json({ error: "Insufficient ChainCoin balance" });
    return;
  }

  // Deduct from client, create escrow
  await db.update(usersTable)
    .set({ chainCoinBalance: sql`${usersTable.chainCoinBalance} - ${String(svc.price)}` })
    .where(eq(usersTable.id, req.user!.id));

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + svc.deliveryDays);

  const [order] = await db.insert(ordersTable).values({
    serviceId: body.data.serviceId,
    clientId: req.user!.id,
    freelancerId: fl.userId,
    amount: String(svc.price),
    requirements: body.data.requirements,
    dueDate,
    status: "pending",
  }).returning();

  const [escrow] = await db.insert(escrowTable).values({
    orderId: order.id,
    amount: String(svc.price),
    status: "held",
    milestones: [],
  }).returning();

  await db.update(ordersTable).set({ escrowId: escrow.id, status: "in_progress" })
    .where(eq(ordersTable.id, order.id));

  await db.update(servicesTable)
    .set({ totalOrders: sql`${servicesTable.totalOrders} + 1` })
    .where(eq(servicesTable.id, svc.id));

  const [updatedOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, order.id));
  res.status(201).json({
    id: updatedOrder.id, serviceId: updatedOrder.serviceId, clientId: updatedOrder.clientId,
    freelancerId: updatedOrder.freelancerId, amount: Number(updatedOrder.amount),
    status: updatedOrder.status, requirements: updatedOrder.requirements, deliverables: updatedOrder.deliverables,
    dueDate: updatedOrder.dueDate?.toISOString() ?? null, completedAt: updatedOrder.completedAt?.toISOString() ?? null,
    escrowId: updatedOrder.escrowId, createdAt: updatedOrder.createdAt.toISOString(),
  });
});

router.get("/orders/:id", authenticate, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!o) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({
    id: o.id, serviceId: o.serviceId, clientId: o.clientId, freelancerId: o.freelancerId,
    amount: Number(o.amount), status: o.status, requirements: o.requirements,
    deliverables: o.deliverables, dueDate: o.dueDate?.toISOString() ?? null,
    completedAt: o.completedAt?.toISOString() ?? null, escrowId: o.escrowId,
    createdAt: o.createdAt.toISOString(),
  });
});

router.patch("/orders/:id", authenticate, async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateOrderBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const update: Record<string, unknown> = { status: body.data.status };
  if (body.data.deliverables !== undefined) update.deliverables = body.data.deliverables;
  if (body.data.status === "completed") update.completedAt = new Date();

  const [o] = await db.update(ordersTable).set(update).where(eq(ordersTable.id, params.data.id)).returning();
  if (!o) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // If completed, release escrow and pay freelancer
  if (body.data.status === "completed" && o.escrowId) {
    const [esc] = await db.select().from(escrowTable).where(eq(escrowTable.id, o.escrowId));
    if (esc && esc.status === "held") {
      await db.update(escrowTable).set({ status: "released", releasedAt: new Date() }).where(eq(escrowTable.id, esc.id));
      await db.update(usersTable)
        .set({ chainCoinBalance: sql`${usersTable.chainCoinBalance} + ${String(esc.amount)}` })
        .where(eq(usersTable.id, o.freelancerId));
      await db.update(freelancersTable)
        .set({
          completedOrders: sql`${freelancersTable.completedOrders} + 1`,
          totalEarnings: sql`${freelancersTable.totalEarnings} + ${String(esc.amount)}`,
        })
        .where(eq(freelancersTable.userId, o.freelancerId));
    }
  }

  res.json({
    id: o.id, serviceId: o.serviceId, clientId: o.clientId, freelancerId: o.freelancerId,
    amount: Number(o.amount), status: o.status, requirements: o.requirements,
    deliverables: o.deliverables, dueDate: o.dueDate?.toISOString() ?? null,
    completedAt: o.completedAt?.toISOString() ?? null, escrowId: o.escrowId,
    createdAt: o.createdAt.toISOString(),
  });
});

export default router;
