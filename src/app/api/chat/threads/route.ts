import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/chat/threads — لیست مکالمات کاربر
export async function GET() {
  const threads = await db.chatThread.findMany({
    where: { tenantId: TENANT_ID },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // گرفتن اطلاعات کاربران
  const users = await db.user.findMany({
    where: { tenantId: TENANT_ID },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const result = threads.map((t) => {
    const participantIds = JSON.parse(t.participants || "[]") as string[];
    const participants = participantIds
      .map((id) => {
        const u = userMap.get(id);
        if (!u) return null;
        return {
          id: u.id,
          name: u.name,
          role: u.role,
          avatarUrl: u.avatarUrl,
        };
      })
      .filter(Boolean) as { id: string; name: string; role: string; avatarUrl: string | null }[];

    const lastMsg = t.messages[0];
    const lastSender = lastMsg ? userMap.get(lastMsg.senderId) : null;

    return {
      id: t.id,
      tenantId: t.tenantId,
      participantIds,
      participants,
      lastMessageAt: t.lastMessageAt,
      createdAt: t.createdAt,
      lastMessage: lastMsg
        ? {
            id: lastMsg.id,
            senderId: lastMsg.senderId,
            senderName: lastSender?.name || "کاربر",
            content: lastMsg.content,
            readBy: JSON.parse(lastMsg.readBy || "[]") as string[],
            createdAt: lastMsg.createdAt,
          }
        : null,
    };
  });

  return NextResponse.json({ threads: result });
}

// POST /api/chat/threads — ایجاد مکالمه جدید
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { participants } = body as { participants: string[] };

  if (!participants || participants.length < 2) {
    return NextResponse.json(
      { error: "حداقل دو کاربر برای ایجاد مکالمه نیاز است" },
      { status: 400 }
    );
  }

  const thread = await db.chatThread.create({
    data: {
      tenantId: TENANT_ID,
      participants: JSON.stringify(participants),
    },
  });

  return NextResponse.json({ thread });
}
