import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canUseTexsa } from "@/lib/auth/texsa-access";
import { generateRoundTripReport } from "@/lib/texsa/export/roundtrip-report";

export const runtime = "nodejs";
export const maxDuration = 120;

// GET /api/texsa/imports/[id]/roundtrip-report — گزارش سازگاری round-trip تکسا
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  if (!(await canUseTexsa(user.id, "texsa.export"))) {
    return NextResponse.json({ error: "مجوز گزارش سازگاری تکسا را ندارید" }, { status: 403 });
  }

  const imp = await db.texsaImport.findUnique({ where: { id }, select: { id: true } });
  if (!imp) return NextResponse.json({ error: "ایمپورت یافت نشد" }, { status: 404 });

  try {
    const report = await generateRoundTripReport(id);
    return NextResponse.json({ report });
  } catch (err) {
    console.error("[texsa roundtrip-report] error:", err);
    return NextResponse.json({ error: "خطا در تولید گزارش سازگاری" }, { status: 500 });
  }
}
