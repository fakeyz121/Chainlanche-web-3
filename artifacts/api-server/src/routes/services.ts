import { Router, type IRouter } from "express";
import { db, servicesTable, freelancersTable, usersTable } from "@workspace/db";
import { eq, sql, and, gte, lte, ilike, inArray } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import {
  ListServicesQueryParams,
  GetServiceParams,
  CreateServiceBody,
  UpdateServiceParams,
  UpdateServiceBody,
  DeleteServiceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id, username: user.username, email: user.email, role: user.role,
    avatarUrl: user.avatarUrl, walletAddress: user.walletAddress, isSuspended: user.isSuspended,
    chainCoinBalance: Number(user.chainCoinBalance), level: user.level,
    trustScore: user.trustScore ? Number(user.trustScore) : null,
    createdAt: user.createdAt.toISOString(),
  };
}

function formatFreelancer(f: typeof freelancersTable.$inferSelect, user?: typeof usersTable.$inferSelect) {
  return {
    id: f.id, userId: f.userId, user: user ? formatUser(user) : undefined, bio: f.bio,
    skills: f.skills, category: f.category, hourlyRate: Number(f.hourlyRate), status: f.status,
    portfolioItems: f.portfolioItems, completedOrders: f.completedOrders,
    avgRating: f.avgRating ? Number(f.avgRating) : null,
    totalEarnings: Number(f.totalEarnings), level: f.level, createdAt: f.createdAt.toISOString(),
  };
}

function formatService(s: typeof servicesTable.$inferSelect, freelancer?: ReturnType<typeof formatFreelancer>) {
  return {
    id: s.id, freelancerId: s.freelancerId, freelancer,
    title: s.title, description: s.description, category: s.category,
    price: Number(s.price), deliveryDays: s.deliveryDays, status: s.status,
    thumbnailUrl: s.thumbnailUrl, previewImages: s.previewImages, tags: s.tags,
    totalOrders: s.totalOrders, avgRating: s.avgRating ? Number(s.avgRating) : null,
    isFeatured: s.isFeatured, createdAt: s.createdAt.toISOString(),
  };
}

router.get("/services", async (req, res): Promise<void> => {
  const params = ListServicesQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const category = params.success ? params.data.category : undefined;
  const search = params.success ? params.data.search : undefined;
  const minPrice = params.success ? params.data.minPrice : undefined;
  const maxPrice = params.success ? params.data.maxPrice : undefined;
  const freelancerId = params.success ? params.data.freelancerId : undefined;

  const conditions = [eq(servicesTable.status, "active")];
  if (category) conditions.push(eq(servicesTable.category, category));
  if (minPrice) conditions.push(gte(servicesTable.price, String(minPrice)));
  if (maxPrice) conditions.push(lte(servicesTable.price, String(maxPrice)));
  if (freelancerId) conditions.push(eq(servicesTable.freelancerId, freelancerId));

  const rows = await db.select().from(servicesTable)
    .where(and(...conditions))
    .limit(limit).offset((page - 1) * limit);

  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(servicesTable).where(and(...conditions));

  const flIds = [...new Set(rows.map(r => r.freelancerId))];
  const fls = flIds.length > 0
    ? await db.select().from(freelancersTable).where(inArray(freelancersTable.id, flIds))
    : [];
  const uIds = [...new Set(fls.map(f => f.userId))];
  const users = uIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, uIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const flMap = Object.fromEntries(fls.map(f => [f.id, formatFreelancer(f, userMap[f.userId])]));

  res.json({
    services: rows.map(s => formatService(s, flMap[s.freelancerId])),
    total: Number(countResult.count),
    page,
    limit,
  });
});

router.get("/services/featured", async (req, res): Promise<void> => {
  const rows = await db.select().from(servicesTable)
    .where(and(eq(servicesTable.isFeatured, true), eq(servicesTable.status, "active")))
    .limit(8);
  const flIds = [...new Set(rows.map(r => r.freelancerId))];
  const fls = flIds.length > 0
    ? await db.select().from(freelancersTable).where(inArray(freelancersTable.id, flIds))
    : [];
  const uIds = [...new Set(fls.map(f => f.userId))];
  const users = uIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, uIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const flMap = Object.fromEntries(fls.map(f => [f.id, formatFreelancer(f, userMap[f.userId])]));
  res.json(rows.map(s => formatService(s, flMap[s.freelancerId])));
});

router.post("/services", authenticate, async (req, res): Promise<void> => {
  const body = CreateServiceBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [fl] = await db.select().from(freelancersTable).where(eq(freelancersTable.userId, req.user!.id));
  if (!fl) {
    res.status(400).json({ error: "You must be a freelancer to create services" });
    return;
  }
  const [s] = await db.insert(servicesTable).values({
    freelancerId: fl.id,
    title: body.data.title,
    description: body.data.description,
    category: body.data.category,
    price: String(body.data.price),
    deliveryDays: body.data.deliveryDays,
    thumbnailUrl: body.data.thumbnailUrl,
    previewImages: body.data.previewImages ?? [],
    tags: body.data.tags ?? [],
  }).returning();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, fl.userId));
  res.status(201).json(formatService(s, formatFreelancer(fl, user)));
});

router.get("/services/:id", async (req, res): Promise<void> => {
  const params = GetServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [s] = await db.select().from(servicesTable).where(eq(servicesTable.id, params.data.id));
  if (!s) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  const [fl] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, s.freelancerId));
  const [user] = fl ? await db.select().from(usersTable).where(eq(usersTable.id, fl.userId)) : [undefined];
  res.json(formatService(s, fl ? formatFreelancer(fl, user) : undefined));
});

router.patch("/services/:id", authenticate, async (req, res): Promise<void> => {
  const params = UpdateServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateServiceBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const update: Record<string, unknown> = {};
  if (body.data.title !== undefined) update.title = body.data.title;
  if (body.data.description !== undefined) update.description = body.data.description;
  if (body.data.category !== undefined) update.category = body.data.category;
  if (body.data.price !== undefined) update.price = String(body.data.price);
  if (body.data.deliveryDays !== undefined) update.deliveryDays = body.data.deliveryDays;
  if (body.data.thumbnailUrl !== undefined) update.thumbnailUrl = body.data.thumbnailUrl;
  if (body.data.previewImages !== undefined) update.previewImages = body.data.previewImages;
  if (body.data.tags !== undefined) update.tags = body.data.tags;
  if (body.data.status !== undefined) update.status = body.data.status;

  const [s] = await db.update(servicesTable).set(update).where(eq(servicesTable.id, params.data.id)).returning();
  if (!s) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  const [fl] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, s.freelancerId));
  const [user] = fl ? await db.select().from(usersTable).where(eq(usersTable.id, fl.userId)) : [undefined];
  res.json(formatService(s, fl ? formatFreelancer(fl, user) : undefined));
});

router.delete("/services/:id", authenticate, async (req, res): Promise<void> => {
  const params = DeleteServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(servicesTable).where(eq(servicesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
