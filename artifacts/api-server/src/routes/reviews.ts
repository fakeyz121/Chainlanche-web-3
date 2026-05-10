import { Router, type IRouter } from "express";
import { db, reviewsTable, usersTable, freelancersTable, ordersTable } from "@workspace/db";
import { eq, sql, inArray } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import {
  ListReviewsQueryParams,
  CreateReviewBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id, username: u.username, email: u.email, role: u.role, avatarUrl: u.avatarUrl,
    walletAddress: u.walletAddress, isSuspended: u.isSuspended,
    chainCoinBalance: Number(u.chainCoinBalance), level: u.level,
    trustScore: u.trustScore ? Number(u.trustScore) : null, createdAt: u.createdAt.toISOString(),
  };
}

router.get("/reviews", async (req, res): Promise<void> => {
  const params = ListReviewsQueryParams.safeParse(req.query);
  const freelancerId = params.success ? params.data.freelancerId : undefined;
  const serviceId = params.success ? params.data.serviceId : undefined;

  let query = db.select().from(reviewsTable).$dynamic();
  if (freelancerId) query = query.where(eq(reviewsTable.freelancerId, freelancerId));
  else if (serviceId) query = query.where(eq(reviewsTable.serviceId, serviceId));

  const rows = await query;
  const reviewerIds = [...new Set(rows.map(r => r.reviewerId))];
  const reviewers = reviewerIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, reviewerIds))
    : [];
  const reviewerMap = Object.fromEntries(reviewers.map(u => [u.id, u]));

  res.json(rows.map(r => ({
    id: r.id, orderId: r.orderId, reviewerId: r.reviewerId,
    reviewer: reviewerMap[r.reviewerId] ? formatUser(reviewerMap[r.reviewerId]) : undefined,
    freelancerId: r.freelancerId, serviceId: r.serviceId, rating: r.rating,
    comment: r.comment, createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/reviews", authenticate, async (req, res): Promise<void> => {
  const body = CreateReviewBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, body.data.orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    orderId: body.data.orderId,
    reviewerId: req.user!.id,
    freelancerId: order.freelancerId,
    serviceId: order.serviceId,
    rating: body.data.rating,
    comment: body.data.comment,
  }).returning();

  // Update freelancer avg rating
  const allReviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable)
    .where(eq(reviewsTable.freelancerId, order.freelancerId));
  const avg = allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length;
  await db.update(freelancersTable)
    .set({ avgRating: String(avg.toFixed(2)) })
    .where(eq(freelancersTable.userId, order.freelancerId));

  const [reviewer] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  res.status(201).json({
    id: review.id, orderId: review.orderId, reviewerId: review.reviewerId,
    reviewer: reviewer ? formatUser(reviewer) : undefined,
    freelancerId: review.freelancerId, serviceId: review.serviceId,
    rating: review.rating, comment: review.comment, createdAt: review.createdAt.toISOString(),
  });
});

export default router;
