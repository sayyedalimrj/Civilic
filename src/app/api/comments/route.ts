import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/comments?projectId=X&entityType=Y&entityId=Z — کامنت‌های یک موجودیت
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  const where: any = { tenantId: TENANT_ID };
  if (projectId) where.projectId = projectId;
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  const comments = await db.comment.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
}

// POST /api/comments — ایجاد کامنت جدید
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    projectId,
    entityType,
    entityId,
    entityLabel,
    userId,
    userName,
    content,
    mentions = [],
    parentCommentId = null,
  } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "محتوای کامنت خالی است" }, { status: 400 });
  }
  if (!projectId || !entityType || !entityId || !userId) {
    return NextResponse.json(
      { error: "اطلاعات کامل نیست (projectId/entityType/entityId/userId)" },
      { status: 400 }
    );
  }

  const comment = await db.comment.create({
    data: {
      tenantId: TENANT_ID,
      projectId,
      userId,
      userName: userName || "کاربر",
      entityType,
      entityId,
      entityLabel: entityLabel || null,
      parentCommentId,
      content: content.trim(),
      mentions: JSON.stringify(mentions),
    },
  });

  // ساخت هشدار برای کاربران منشن‌شده
  for (const mentionId of mentions) {
    if (mentionId === userId) continue;
    const mentionUser = await db.user.findUnique({ where: { id: mentionId } });
    if (mentionUser) {
      await db.alert.create({
        data: {
          tenantId: TENANT_ID,
          projectId,
          type: "WORKFLOW",
          severity: "INFO",
          title: "اشاره در کامنت",
          message: `${userName} شما را در یک کامنت mention کرد: «${content.trim().slice(0, 80)}»`,
          relatedId: comment.id,
          relatedType: "COMMENT",
        },
      });
    }
  }

  return NextResponse.json({ comment });
}
