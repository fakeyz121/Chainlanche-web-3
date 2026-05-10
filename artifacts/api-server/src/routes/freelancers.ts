import { Router, type IRouter } from "express";
import { db, freelancersTable, usersTable } from "@workspace/db";
import { eq, sql, ilike, inArray } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/authenticate";
import {
  ListFreelancersQueryParams,
  GetFreelancerParams,
  CreateFreelancerBody,
  UpdateFreelancerParams,
  UpdateFreelancerBody,
  VerifyFreelancerParams,
  VerifyFreelancerBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    walletAddress: user.walletAddress,
    isSuspended: user.isSuspended,
    chainCoinBalance: Number(user.chainCoinBalance),
    level: user.level,
    trustScore: user.trustScore ? Number(user.trustScore) : null,
    createdAt: user.createdAt.toISOString(),
  };
}

function formatFreelancer(f: typeof freelancersTable.$inferSelect, user?: typeof usersTable.$inferSelect) {
  return {
    id: f.id,
    userId: f.userId,
    user: user ? formatUser(user) : undefined,
    bio: f.bio,
    skills: f.skills,
    category: f.category,
    hourlyRate: Number(f.hourlyRate),
    status: f.status,
    portfolioItems: f.portfolioItems,
    completedOrders: f.completedOrders,
    avgRating: f.avgRating ? Number(f.avgRating) : null,
    totalEarnings: Number(f.totalEarnings),
    level: f.level,
    createdAt: f.createdAt.toISOString(),
  };
}

router.get("/freelancers", async (req, res): Promise<void> => {
  const params = ListFreelancersQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const category = params.success ? params.data.category : undefined;

  let query = db.select().from(freelancersTable).$dynamic();
  if (category) {
    query = query.where(eq(freelancersTable.category, category));
  }

  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(freelancersTable);
  const rows = await query.limit(limit).offset((page - 1) * limit);

  const userIds = rows.map(r => r.userId);
  const users = userIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  res.json({
    freelancers: rows.map(f => formatFreelancer(f, userMap[f.userId])),
    total: Number(countResult.count),
    page,
    limit,
  });
});

router.post("/freelancers", authenticate, async (req, res): Promise<void> => {
  const body = CreateFreelancerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const existing = await db.select().from(freelancersTable).where(eq(freelancersTable.userId, req.user!.id));
  if (existing.length > 0) {
    res.status(400).json({ error: "Freelancer profile already exists" });
    return;
  }

  const [f] = await db.insert(freelancersTable).values({
    userId: req.user!.id,
    bio: body.data.bio,
    skills: body.data.skills,
    category: body.data.category,
    hourlyRate: String(body.data.hourlyRate),
    portfolioItems: body.data.portfolioItems ?? [],
    status: "pending",
  }).returning();

  await db.update(usersTable).set({ role: "freelancer" }).where(eq(usersTable.id, req.user!.id));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  res.status(201).json(formatFreelancer(f, user));
});

router.get("/freelancers/:id", async (req, res): Promise<void> => {
  const params = GetFreelancerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [f] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, params.data.id));
  if (!f) {
    res.status(404).json({ error: "Freelancer not found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, f.userId));
  res.json(formatFreelancer(f, user));
});

router.patch("/freelancers/:id", authenticate, async (req, res): Promise<void> => {
  const params = UpdateFreelancerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateFreelancerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const update: Record<string, unknown> = {};
  if (body.data.bio !== undefined) update.bio = body.data.bio;
  if (body.data.skills !== undefined) update.skills = body.data.skills;
  if (body.data.category !== undefined) update.category = body.data.category;
  if (body.data.hourlyRate !== undefined) update.hourlyRate = String(body.data.hourlyRate);
  if (body.data.portfolioItems !== undefined) update.portfolioItems = body.data.portfolioItems;

  const [f] = await db.update(freelancersTable).set(update).where(eq(freelancersTable.id, params.data.id)).returning();
  if (!f) {
    res.status(404).json({ error: "Freelancer not found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, f.userId));
  res.json(formatFreelancer(f, user));
});

router.patch("/freelancers/:id/verify", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const params = VerifyFreelancerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = VerifyFreelancerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [f] = await db.update(freelancersTable)
    .set({ status: body.data.status })
    .where(eq(freelancersTable.id, params.data.id))
    .returning();
  if (!f) {
    res.status(404).json({ error: "Freelancer not found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, f.userId));
  res.json(formatFreelancer(f, user));
});

export default router;
