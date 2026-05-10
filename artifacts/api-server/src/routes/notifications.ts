import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id, userId: n.userId, type: n.type, title: n.title,
    message: n.message, isRead: n.isRead, linkUrl: n.linkUrl,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", authenticate, async (req, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .limit(50);
  res.json(notifications.map(formatNotification));
});

router.patch("/notifications/:id/read", authenticate, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [n] = await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id))
    .returning();
  if (!n) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatNotification(n));
});

router.patch("/notifications/read-all", authenticate, async (req, res): Promise<void> => {
  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, req.user!.id));
  res.json({ success: true });
});

export default router;
