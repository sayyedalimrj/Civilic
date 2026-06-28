import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/alerts — لیست هشدارها
// پارامترها: projectId (اختیاری), onlyUnread (اختیاری), type (اختیاری)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const onlyUnread = searchParams.get("onlyUnread") === "true";
  const type = searchParams.get("type");

  const where: any = { tenantId: TENANT_ID };
  if (projectId) where.projectId = projectId;
  if (onlyUnread) where.isRead = false;
  if (type) where.type = type;

  const alerts = await db.alert.findMany({
    where,
    orderBy: [{ isResolved: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const count = alerts.length;
  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const criticalCount = alerts.filter(
    (a) => !a.isResolved && a.severity === "CRITICAL"
  ).length;

  return NextResponse.json({ alerts, count, unreadCount, criticalCount });
}

// POST /api/alerts — ایجاد هشدار (برای تست یا توسط سیستم)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    projectId,
    type,
    severity = "INFO",
    title,
    message,
    relatedId,
    relatedType,
    dueDate,
  } = body;

  if (!title || !message) {
    return NextResponse.json({ error: "عنوان و پیام الزامی است" }, { status: 400 });
  }

  const alert = await db.alert.create({
    data: {
      tenantId: TENANT_ID,
      projectId: projectId || null,
      type: type || "SYSTEM",
      severity,
      title,
      message,
      relatedId: relatedId || null,
      relatedType: relatedType || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return NextResponse.json({ alert });
}
