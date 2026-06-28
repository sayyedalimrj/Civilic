import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/documents/archive — آرشیو مرکزی مستندات
// پارامترها: projectId, category, entityType
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const category = searchParams.get("category");
  const entityType = searchParams.get("entityType");

  const where: any = { tenantId: "tenant-demo" };
  if (projectId) where.projectId = projectId;
  if (category) where.category = category;
  if (entityType) where.entityType = entityType;

  const documents = await db.documentFile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { name: true, code: true } },
    },
    take: 200,
  });

  // آمار
  const allDocs = await db.documentFile.findMany({
    where: { tenantId: "tenant-demo" },
    select: { category: true, sizeBytes: true },
  });

  const byCategory = allDocs.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = { count: 0, totalSize: 0 };
    acc[d.category].count++;
    acc[d.category].totalSize += d.sizeBytes;
    return acc;
  }, {} as Record<string, { count: number; totalSize: number }>);

  const summary = {
    total: allDocs.length,
    totalSize: allDocs.reduce((s, d) => s + d.sizeBytes, 0),
    byCategory,
  };

  return NextResponse.json({ documents, summary });
}
