import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recomputeSummary, computeFinancialRow, type Coefficients } from "@/lib/calc/cascade";

// GET /api/projects/[id] — جزئیات پروژه با تمام روابط
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      detailBoqs: {
        orderBy: { code: "asc" },
      },
      summaryBoqs: { orderBy: { code: "asc" } },
      financialSheet: { orderBy: { code: "asc" } },
      chapters: { orderBy: { chapterNo: "asc" } },
      payments: {
        orderBy: { periodNo: "asc" },
        include: { items: true },
      },
      priceList: { include: { items: true } },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

// PATCH /api/projects/[id] — به‌روزرسانی پروژه (شامل ضرایب)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.code !== undefined) data.code = body.code;
  if (body.documentCode !== undefined) data.documentCode = body.documentCode;
  if (body.year !== undefined) data.year = Number(body.year);
  if (body.contractAmount !== undefined) data.contractAmount = Number(body.contractAmount);
  if (body.contractDate !== undefined) data.contractDate = body.contractDate ? new Date(body.contractDate) : null;
  if (body.location !== undefined) data.location = body.location;
  if (body.description !== undefined) data.description = body.description;
  if (body.status !== undefined) data.status = body.status;
  if (body.coefficients !== undefined) data.coefficients = JSON.stringify(body.coefficients);

  const project = await db.project.update({ where: { id }, data });
  return NextResponse.json({ project });
}
