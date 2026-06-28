import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/calendar?year=X&month=Y — رویدادهای تقویم
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const projectId = searchParams.get("projectId");

  const where: any = { tenantId: TENANT_ID };
  if (projectId) where.projectId = projectId;

  // فیلتر بر اساس سال/ماه شمسی (ساده: فیلتر بر اساس startDate)
  if (year || month) {
    const start = new Date();
    const end = new Date();
    if (year) {
      start.setFullYear(Number(year), month ? Number(month) - 1 : 0, 1);
      end.setFullYear(Number(year), month ? Number(month) : 11, month ? 0 : 31);
    }
    where.startDate = { gte: start, lte: end };
  }

  const events = await db.calendarEvent.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: { project: { select: { name: true, code: true } } },
  });

  return NextResponse.json({ events });
}

// POST /api/calendar — ایجاد رویداد جدید
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    projectId,
    title,
    description,
    type,
    startDate,
    endDate,
    allDay,
    location,
    attendees,
    color,
  } = body;

  if (!title || !type || !startDate) {
    return NextResponse.json(
      { error: "عنوان، نوع و تاریخ شروع الزامی است" },
      { status: 400 }
    );
  }

  const event = await db.calendarEvent.create({
    data: {
      tenantId: TENANT_ID,
      projectId: projectId || null,
      title,
      description: description || null,
      type,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      allDay: allDay !== false,
      location: location || null,
      attendees: JSON.stringify(attendees || []),
      color: color || "amber",
    },
  });

  return NextResponse.json({ event });
}
