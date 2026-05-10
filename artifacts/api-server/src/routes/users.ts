import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, sql } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/authenticate";
import {
  ListUsersQueryParams,
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  SuspendUserParams,
  SuspendUserBody,
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

router.get("/users", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const search = params.success ? params.data.search : undefined;
  const role = params.success ? params.data.role : undefined;

  let query = db.select().from(usersTable).$dynamic();
  if (search) {
    query = query.where(ilike(usersTable.username, `%${search}%`));
  } else if (role) {
    query = query.where(eq(usersTable.role, role));
  }

  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  const users = await query.limit(limit).offset((page - 1) * limit);

  res.json({
    users: users.map(formatUser),
    total: Number(countResult.count),
    page,
    limit,
  });
});

router.get("/users/:id", authenticate, async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.patch("/users/:id", authenticate, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (req.user!.id !== params.data.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const body = UpdateUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [user] = await db.update(usersTable)
    .set({ ...body.data })
    .where(eq(usersTable.id, params.data.id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

router.patch("/users/:id/suspend", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const params = SuspendUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SuspendUserBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [user] = await db.update(usersTable)
    .set({ isSuspended: body.data.suspended })
    .where(eq(usersTable.id, params.data.id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

export default router;
