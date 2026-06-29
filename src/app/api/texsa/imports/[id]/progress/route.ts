import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canUseTexsa } from "@/lib/auth/texsa-access";

export const runtime = "nodejs";

// GET /api/texsa/imports/[id]/progress — وضعیت پیشرفت یک ایمپورت
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  if (!(await canUseTexsa(user.id, "texsa.import"))) {
    return NextResponse.json({ error: "مجوز مشاهده‌ی ایمپورت تکسا را ندارید" }, { status: 403 });
  }

  const imp = await db.texsaImport.findUnique({
    where: { id },
    select: {
      id: true, status: true, originalFileName: true, fileSizeBytes: true,
      totalRows: true, totalTables: true, projectId: true, projectName: true,
      projectCode: true, texsaVersion: true, warningsJson: true, errorsJson: true,
      createdAt: true, updatedAt: true,
    },
  });
  if (!imp) return NextResponse.json({ error: "ایمپورت یافت نشد" }, { status: 404 });

  const persistedRows = await db.texsaRawRow.count({ where: { importId: id } });

  return NextResponse.json({
    ...imp,
    persistedRows,
    isDone: imp.status === "DONE",
    isFailed: imp.status === "FAILED",
    isNormalized: !!imp.projectId,
  });
}
