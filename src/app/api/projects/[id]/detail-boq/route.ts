import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recomputeSummary, computeFinancialRow, type Coefficients } from "@/lib/calc/cascade";

// GET /api/projects/[id]/detail-boq
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await db.detailBoq.findMany({
    where: { projectId: id },
    orderBy: { code: "asc" },
    include: { priceListItem: true },
  });
  return NextResponse.json({ items });
}

// POST — افزودن ردیف ریزمتره (با بازمحاسبه‌ی زنجیره‌ای)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const item = await db.detailBoq.create({
    data: {
      projectId: id,
      priceListItemId: body.priceListItemId || null,
      code: body.code,
      description: body.description,
      unit: body.unit,
      quantity: Number(body.quantity) || 0,
    },
  });

  // ── بازمحاسبه‌ی زنجیره‌ای ──
  const cascadeResult = await recomputeCascade(id);

  return NextResponse.json(
    { item, cascade: cascadeResult },
    { status: 201, headers: { "X-Cascade-Update": "true" } }
  );
}

// PUT — ویرایش ردیف ریزمتره
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { itemId, ...fields } = body;

  const data: Record<string, unknown> = {};
  if (fields.code !== undefined) data.code = fields.code;
  if (fields.description !== undefined) data.description = fields.description;
  if (fields.unit !== undefined) data.unit = fields.unit;
  if (fields.quantity !== undefined) data.quantity = Number(fields.quantity);

  const item = await db.detailBoq.update({
    where: { id: itemId, projectId: id },
    data,
  });

  const cascadeResult = await recomputeCascade(id);
  return NextResponse.json(
    { item, cascade: cascadeResult },
    { headers: { "X-Cascade-Update": "true" } }
  );
}

// DELETE — حذف ردیف
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId لازم است" }, { status: 400 });

  await db.detailBoq.delete({ where: { id: itemId, projectId: id } });
  const cascadeResult = await recomputeCascade(id);
  return NextResponse.json(
    { ok: true, cascade: cascadeResult },
    { headers: { "X-Cascade-Update": "true" } }
  );
}

// ─── تابع مرکزی بازمحاسبه‌ی زنجیره‌ای ───
export async function recomputeCascade(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      detailBoqs: true,
      priceList: { include: { items: true } },
    },
  });
  if (!project) return null;

  const coeffs: Coefficients = JSON.parse(project.coefficients || "{}");

  // مرحله ۱: تجمیع ریزمتره → خلاصه‌متره
  const details = project.detailBoqs.map((d) => ({
    code: d.code,
    description: d.description,
    unit: d.unit,
    quantity: d.quantity,
  }));
  const summaryRows = recomputeSummary(details);

  // پاکسازی خلاصه‌متره و برگه مالی قبلی
  await db.summaryBoq.deleteMany({ where: { projectId } });
  await db.financialSheetItem.deleteMany({ where: { projectId } });

  let totalAmount = 0;
  const chaptersMap = new Map<number, number>();

  for (const s of summaryRows) {
    // قیمت از فهرست بها
    const plItem = project.priceList?.items.find((p) => p.code === s.code);
    const unitPrice = plItem?.unitPrice || 0;

    const sb = await db.summaryBoq.create({
      data: {
        projectId,
        priceListItemId: plItem?.id || null,
        code: s.code,
        description: s.description,
        unit: s.unit,
        totalQuantity: s.totalQuantity,
      },
    });

    const calc = computeFinancialRow(s, unitPrice, coeffs);
    totalAmount += calc.adjustedTotal;
    const chapterNo = parseInt(s.code.charAt(0)) || 1;
    chaptersMap.set(chapterNo, (chaptersMap.get(chapterNo) || 0) + calc.adjustedTotal);

    await db.financialSheetItem.create({
      data: {
        projectId,
        summaryBoqId: sb.id,
        code: s.code,
        description: s.description,
        unit: s.unit,
        quantity: s.totalQuantity,
        unitPrice,
        totalAmount: calc.adjustedTotal,
        reference: "NET",
        chapterNo,
        isStarred: false,
        analysis: JSON.stringify(calc.analysis),
      },
    });
  }

  // به‌روزرسانی فصول
  await db.chapter.deleteMany({ where: { projectId } });
  const chapterTitles: Record<number, string> = {
    1: "فصل اول — عملیات زمینی",
    2: "فصل دوم — اسکلت و سازه",
    3: "فصل سوم — دیوارچینی و جداره",
    4: "فصل چهارم — نازک‌کاری",
    5: "فصل پنجم — تأسیسات",
    6: "فصل ششم — در و پنجره",
    7: "فصل هفتم — متفرقه",
  };
  for (const [no, amount] of chaptersMap.entries()) {
    await db.chapter.create({
      data: {
        projectId,
        chapterNo: no,
        title: chapterTitles[no] || `فصل ${no}`,
        amount,
        percent: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      },
    });
  }

  // به‌روزرسانی cachedTotal پروژه
  await db.project.update({
    where: { id: projectId },
    data: { cachedTotal: totalAmount },
  });

  return {
    summaryBoqUpdated: summaryRows.length,
    financialSheetTotal: totalAmount,
    chaptersUpdated: chaptersMap.size,
  };
}
