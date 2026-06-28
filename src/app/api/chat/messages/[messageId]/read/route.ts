import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/chat/messages/[messageId]/read — علامت‌گذاری پیام به‌عنوان خوانده‌شده
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const body = await req.json();
  const { userId } = body as { userId: string };

  const message = await db.chatMessage.findUnique({ where: { id: messageId } });
  if (!message) {
    return NextResponse.json({ error: "پیام یافت نشد" }, { status: 404 });
  }

  const readBy = new Set(JSON.parse(message.readBy || "[]") as string[]);
  readBy.add(userId);

  const updated = await db.chatMessage.update({
    where: { id: messageId },
    data: { readBy: JSON.stringify(Array.from(readBy)) },
  });

  return NextResponse.json({ message: updated });
}
