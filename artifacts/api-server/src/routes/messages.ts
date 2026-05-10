import { Router, type IRouter } from "express";
import { db, conversationsTable, messagesTable, usersTable } from "@workspace/db";
import { eq, sql, inArray } from "drizzle-orm";
import { authenticate } from "../middlewares/authenticate";
import {
  ListMessagesParams,
  SendMessageParams,
  SendMessageBody,
  CreateConversationBody,
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

function formatMessage(m: typeof messagesTable.$inferSelect, sender?: ReturnType<typeof formatUser>) {
  return {
    id: m.id, conversationId: m.conversationId, senderId: m.senderId, sender,
    content: m.content, fileUrl: m.fileUrl, fileType: m.fileType,
    isRead: m.isRead, createdAt: m.createdAt.toISOString(),
  };
}

router.get("/conversations", authenticate, async (req, res): Promise<void> => {
  const convs = await db.select().from(conversationsTable)
    .where(sql`${req.user!.id} = ANY(${conversationsTable.participantIds})`);

  const result = [];
  for (const conv of convs) {
    const participantIds = conv.participantIds;
    const participants = participantIds.length > 0
      ? await db.select().from(usersTable).where(inArray(usersTable.id, participantIds))
      : [];
    const [lastMessage] = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, conv.id))
      .limit(1);
    const [unreadCountResult] = await db.select({ count: sql<number>`count(*)` }).from(messagesTable)
      .where(sql`${messagesTable.conversationId} = ${conv.id} AND ${messagesTable.isRead} = false AND ${messagesTable.senderId} != ${req.user!.id}`);

    result.push({
      id: conv.id,
      participantIds: conv.participantIds,
      participants: participants.map(formatUser),
      lastMessage: lastMessage ? formatMessage(lastMessage) : undefined,
      unreadCount: Number(unreadCountResult.count),
      createdAt: conv.createdAt.toISOString(),
    });
  }

  res.json(result);
});

router.post("/conversations", authenticate, async (req, res): Promise<void> => {
  const body = CreateConversationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // Check if conversation already exists
  const existing = await db.select().from(conversationsTable)
    .where(sql`${req.user!.id} = ANY(${conversationsTable.participantIds}) AND ${body.data.participantId} = ANY(${conversationsTable.participantIds})`);

  if (existing.length > 0) {
    const conv = existing[0];
    const participants = await db.select().from(usersTable)
      .where(inArray(usersTable.id, conv.participantIds));
    res.status(201).json({
      id: conv.id, participantIds: conv.participantIds,
      participants: participants.map(formatUser),
      unreadCount: 0, createdAt: conv.createdAt.toISOString(),
    });
    return;
  }

  const [conv] = await db.insert(conversationsTable).values({
    participantIds: [req.user!.id, body.data.participantId],
    orderId: body.data.orderId ?? null,
  }).returning();

  const participants = await db.select().from(usersTable)
    .where(inArray(usersTable.id, conv.participantIds));

  res.status(201).json({
    id: conv.id, participantIds: conv.participantIds,
    participants: participants.map(formatUser),
    unreadCount: 0, createdAt: conv.createdAt.toISOString(),
  });
});

router.get("/conversations/:id/messages", authenticate, async (req, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const messages = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id));

  const senderIds = [...new Set(messages.map(m => m.senderId))];
  const senders = senderIds.length > 0
    ? await db.select().from(usersTable).where(inArray(usersTable.id, senderIds))
    : [];
  const senderMap = Object.fromEntries(senders.map(u => [u.id, u]));

  // Mark messages as read
  await db.update(messagesTable)
    .set({ isRead: true })
    .where(sql`${messagesTable.conversationId} = ${params.data.id} AND ${messagesTable.senderId} != ${req.user!.id}`);

  res.json(messages.map(m => formatMessage(m, senderMap[m.senderId] ? formatUser(senderMap[m.senderId]) : undefined)));
});

router.post("/conversations/:id/messages", authenticate, async (req, res): Promise<void> => {
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SendMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [msg] = await db.insert(messagesTable).values({
    conversationId: params.data.id,
    senderId: req.user!.id,
    content: body.data.content,
    fileUrl: body.data.fileUrl ?? null,
    fileType: body.data.fileType ?? null,
  }).returning();

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  res.status(201).json(formatMessage(msg, sender ? formatUser(sender) : undefined));
});

export default router;
