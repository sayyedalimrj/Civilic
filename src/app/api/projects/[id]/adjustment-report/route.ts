import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/projects/[id]/adjustment-report?type=TEMPORARY|FINAL|REVERSE
// خروجی: لیست ردیف‌های گزارش تعدیل + پاورقی قانونی + مشخصات طرفین
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "TEMPORARY";

  const project = await db.project.findUnique({
    where: { id },
    include: {
      tenant: true,
      priceList: true,
      chapters: { orderBy: { chapterNo: "asc" } },
      payments: {
        where: { status: { in: ["SUBMITTED", "CONSULTANT_APPROVED", "FINALIZED"] } },
        orderBy: { periodNo: "asc" },
        include: { items: true },
      },
      adjustmentRows: {
        where: { adjustmentType: type },
        orderBy: { chapterNo: "asc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "پروژه یافت نشد" }, { status: 404 });
  }

  // گرفتن شاخص‌های مرتبط با رشته‌ی پروژه
  const discipline = project.priceList?.discipline || "کلی";
  const indices = await db.indexRecord.findMany({
    where: { OR: [{ discipline }, { discipline: "کلی" }] },
    orderBy: [{ year: "asc" }, { season: "asc" }],
  });

  // ساخت ردیف‌های گزارش تعدیل به‌صورت پویا (اگر ذخیره نشده باشند)
  let rows = project.adjustmentRows;
  if (rows.length === 0) {
    rows = await generateAdjustmentRows(
      project,
      project.chapters,
      project.payments,
      indices,
      type
    );
  }

  // پاورقی قانونی
  const footnotes = generateFootnotes(type, project);

  // مشخصات طرفین
  const signatures = JSON.parse(project.tenant.signatures || "[]");
  const parties = {
    employer: signatures.find((s: any) => s.role === "کارفرما") || { name: "—" },
    consultant: signatures.find((s: any) => s.role === "مشاور") || { name: "—" },
    supervisor: signatures.find((s: any) => s.role === "ناظر") || { name: "—" },
    contractor: signatures.find((s: any) => s.role === "پیمانکار") || { name: "—" },
  };

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      code: project.code,
      contractAmount: project.contractAmount,
      contractDate: project.contractDate,
    },
    tenant: {
      name: project.tenant.name,
      logoUrl: project.tenant.logoUrl,
    },
    rows,
    indices,
    footnotes,
    parties,
    type,
  });
}

// تولید ردیف‌های گزارش تعدیل به‌صورت پویا
async function generateAdjustmentRows(
  project: any,
  chapters: any[],
  payments: any[],
  indices: any[],
  type: string
): Promise<any[]> {
  const rows: any[] = [];

  // شاخص مبنا (قدیمی‌ترین) و کارکرد (جدیدترین)
  const baseIdx = indices[0]?.value || 100;
  const currentIdx = indices[indices.length - 1]?.value || 100;
  const factor = currentIdx / baseIdx;

  // اگر صورت‌وضعیت قبلی و فعلی وجود داشته باشد
  for (let i = 0; i < payments.length; i++) {
    const current = payments[i];
    const previous = payments[i - 1];
    const currentAmount = current.executedAmount;
    const previousAmount = previous?.executedAmount || 0;
    const diff = currentAmount - previousAmount;
    const adjustmentAmount = diff * (factor - 1);

    // توزیع بر اساس فصول
    for (const ch of chapters) {
      const chapterRatio = ch.amount / project.contractAmount || 0;
      rows.push({
        id: `${project.id}-adj-${i}-${ch.chapterNo}`,
        projectId: project.id,
        paymentId: current.id,
        periodLabel: `دوره ${current.periodNo}`,
        chapterNo: ch.chapterNo,
        workPeriodAmount: chapterRatio * currentAmount,
        durationRatio: 1,
        baseIndex: baseIdx,
        currentIndex: currentIdx,
        adjustmentFactor: factor,
        previousAmount: chapterRatio * previousAmount,
        currentAmount: chapterRatio * currentAmount,
        diffAmount: chapterRatio * diff,
        adjustmentAmount: chapterRatio * adjustmentAmount,
        adjustmentType: type,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // ذخیره‌ی ردیف‌ها برای استفاده‌ی بعدی
  for (const r of rows) {
    await db.adjustmentReportRow.create({
      data: {
        tenantId: TENANT_ID,
        projectId: r.projectId,
        paymentId: r.paymentId,
        periodLabel: r.periodLabel,
        chapterNo: r.chapterNo,
        workPeriodAmount: r.workPeriodAmount,
        durationRatio: r.durationRatio,
        baseIndex: r.baseIndex,
        currentIndex: r.currentIndex,
        adjustmentFactor: r.adjustmentFactor,
        previousAmount: r.previousAmount,
        currentAmount: r.currentAmount,
        diffAmount: r.diffAmount,
        adjustmentAmount: r.adjustmentAmount,
        adjustmentType: r.adjustmentType,
      },
    });
  }

  return rows;
}

// پاورقی قانونی بر اساس نوع تعدیل
function generateFootnotes(type: string, project: any): string[] {
  const footnotes: string[] = [];

  if (type === "TEMPORARY") {
    footnotes.push(
      "با توجه به بخشنامه‌ی سه ماهه سوم و چهارم سال ۱۳۹۴، ضریب بالاسری در حاصل مبلغ کارکرد دوره حذف گردیده است."
    );
    footnotes.push(
      "این صورت‌وضعیت به‌عنوان تعدیل موقت محاسبه شده و در صورت‌وضعیت قطعی نهایی خواهد شد."
    );
    footnotes.push(
      "شاخص‌های استفاده‌شده بر اساس آخرین شاخص‌های فصلی منتشرشده توسط سازمان برنامه و بودجه است."
    );
  } else if (type === "FINAL") {
    footnotes.push(
      "این صورت‌وضعیت به‌عنوان تعدیل قطعی محاسبه شده و قابل تغییر نمی‌باشد."
    );
    footnotes.push(
      "ضریب بالاسری و سود پیمانکار در محاسبه‌ی مبلغ کارکرد دوره اعمال شده است."
    );
    footnotes.push(
      "مبلغ تعدیل نهایی بر اساس شاخص کارکرد دوره و نسبت مدت کارکرد محاسبه گردیده است."
    );
  } else if (type === "REVERSE") {
    footnotes.push(
      "این گزارش تعدیل معکوس است و برای بازگشت کسورات یا اصلاح مناقصات استفاده می‌شود."
    );
    footnotes.push(
      "مبلغ تعدیل معکوس با تقسیم مبلغ تعدیل‌شده بر ضریب تعدیل محاسبه می‌شود."
    );
    footnotes.push(
      "بر اساس بخشنامه‌های مربوط به بازگشت کسورات، این مبلغ قابل‌استرداد است."
    );
  }

  footnotes.push(
    `پروژه: ${project.name} — کد: ${project.code} — مبلغ پیمان: ${project.contractAmount.toLocaleString("en-US")} ریال`
  );

  return footnotes;
}
