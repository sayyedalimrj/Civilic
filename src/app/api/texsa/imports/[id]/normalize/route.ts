import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlatformAccess } from "@/lib/auth/permissions";
import { canUseTexsa } from "@/lib/auth/texsa-access";
import { normalizeImport } from "@/lib/texsa/normalize";
import { writeAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/texsa/imports/[id]/normalize — ساخت/به‌روزرسانی پروژه‌ی Civilic از داده‌ی خام
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  if (!(await canUseTexsa(user.id, "texsa.import"))) {
    return NextResponse.json({ error: "مجوز ایمپورت تکسا را ندارید" }, { status: 403 });
  }

  const imp = await db.texsaImport.findUnique({ where: { id } });
  if (!imp) return NextResponse.json({ error: "ایمپورت یافت نشد" }, { status: 404 });
  if (imp.status !== "DONE") {
    return NextResponse.json({ error: "ابتدا باید ایمپورت کامل شود" }, { status: 409 });
  }

  // مستاجر مقصد: مدیر سامانه می‌تواند tenantId بدهد؛ وگرنه مستاجر کاربر
  const platform = await getPlatformAccess(user.id);
  const body = (await req.json().catch(() => ({}))) as { tenantId?: string };
  const tenantId = platform && body.tenantId ? body.tenantId : user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "مستاجر نامشخص است" }, { status: 400 });

  try {
    const result = await normalizeImport(id, tenantId);
    if (result.projectId && result.projectId !== imp.projectId) {
      await db.texsaImport.update({ where: { id }, data: { projectId: result.projectId } });
    }
    await writeAudit({
      tenantId, projectId: result.projectId ?? null, userId: user.id, userName: user.name,
      action: "TEXSA_NORMALIZE", entityType: "TEXSA_IMPORT", entityId: id,
      after: { projectId: result.projectId, stages: result.stats.length }, ipAddr: clientIp(req.headers),
    });
    return NextResponse.json({
      projectId: result.projectId ?? null,
      stats: result.stats,
      facts: result.facts,
    });
  } catch (err) {
    console.error("[texsa normalize] error:", err);
    return NextResponse.json({ error: "خطا در نرمال‌سازی داده‌ی تکسا" }, { status: 500 });
  }
}
