import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/calendar/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const existing = await db.calendarEvent.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  }

  const updated = await db.calendarEvent.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      type: body.type ?? existing.type,
      startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
      endDate: body.endDate ? new Date(body.endDate) : existing.endDate,
      location: body.location ?? existing.location,
      status: body.status ?? existing.status,
      color: body.color ?? existing.color,
      attendees: body.attendees ? JSON.stringify(body.attendees) : existing.attendees,
    },
  });

  return NextResponse.json({ event: updated });
}

// DELETE
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.calendarEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
