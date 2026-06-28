import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/chat/threads/[threadId]/messages — پیام‌های یک مکالمه
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;

  const messages = await db.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
  });

  const senderIds = Array.from(new Set(messages.map((m) => m.senderId)));
  const users = await db.user.findMany({
    where: { id: { in: senderIds } },
    select: { id: true, name: true, avatarUrl: true, role: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const result = messages.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    sender: userMap.get(m.senderId),
    content: m.content,
    readBy: JSON.parse(m.readBy || "[]") as string[],
    createdAt: m.createdAt,
  }));

  return NextResponse.json({ messages: result });
}

// POST /api/chat/threads/[threadId]/messages — ارسال پیام
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;
  const body = await req.json();
  const { senderId, content } = body as { senderId: string; content: string };

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "محتوای پیام خالی است" }, { status: 400 });
  }

  const message = await db.chatMessage.create({
    data: {
      threadId,
      senderId,
      content: content.trim(),
      readBy: JSON.stringify([senderId]),
    },
  });

  await db.chatThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({ message });
}
