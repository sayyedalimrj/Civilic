import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TENANT_ID = "tenant-demo";

// GET /api/dimensions?projectId=X — لیست قالب‌های پشت‌سری
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const where: any = { tenantId: TENANT_ID };
  if (projectId) {
    where.OR = [{ projectId }, { projectId: null }];
  }

  const formulas = await db.dimensionFormula.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ formulas });
}

// POST /api/dimensions — ایجاد قالب پشت‌سری جدید
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    projectId,
    name,
    shape,
    params,
    formulaDisplay,
    unit,
    isReusable = true,
  } = body;

  if (!name || !shape) {
    return NextResponse.json(
      { error: "نام و نوع شکل الزامی است" },
      { status: 400 }
    );
  }

  const parsedParams = typeof params === "string" ? JSON.parse(params) : params;
  const result = computeShape(shape, parsedParams);

  const formula = await db.dimensionFormula.create({
    data: {
      tenantId: TENANT_ID,
      projectId: projectId || null,
      name,
      shape,
      params: JSON.stringify(parsedParams),
      formulaDisplay: formulaDisplay || generateFormulaDisplay(shape, parsedParams),
      lastResult: result,
      unit: unit || "مترمکعب",
      isReusable,
    },
  });

  return NextResponse.json({ formula, computed: result });
}

// موتور محاسبه‌ی اشکال هندسی
function computeShape(shape: string, p: any): number {
  const length = Number(p.length || 0);
  const width = Number(p.width || 0);
  const height = Number(p.height || 0);
  const count = Number(p.count || 1);
  const radius = Number(p.radius || 0);
  const slope = Number(p.slope || 0);
  const topWidth = Number(p.topWidth || 0);
  const bottomWidth = Number(p.bottomWidth || 0);

  switch (shape) {
    case "RECTANGLE":
      // مساحت = طول × عرض ؛ حجم = × ارتفاع × تعداد
      return length * width * height * count;
    case "CIRCLE":
      // مساحت دایره = π × r² ؛ حجم = × ارتفاع
      return Math.PI * radius * radius * height * count;
    case "TRAPEZOID":
      // مساحت ذوزنقه = (قاعده بالا + قاعده پایین) × ارتفاع / 2
      return ((topWidth + bottomWidth) * height / 2) * length * count;
    case "TRIANGLE":
      // مساحت مثلث = قاعده × ارتفاع / 2
      return (width * height / 2) * length * count;
    case "SLOPED_EXCAVATION":
      // حفاری با شیب: V = L × W × H + slope × H² × (L + W) + (4/3) × slope² × H³
      return (
        length * width * height +
        slope * height * height * (length + width) +
        (4 / 3) * slope * slope * height * height * height
      ) * count;
    case "COUNT_ONLY":
      return count;
    default:
      return 0;
  }
}

function generateFormulaDisplay(shape: string, p: any): string {
  const c = p.count || 1;
  switch (shape) {
    case "RECTANGLE":
      return `L × W × H${c > 1 ? ` × تعداد` : ""} = ${p.length || 0} × ${p.width || 0} × ${p.height || 0}${c > 1 ? ` × ${c}` : ""}`;
    case "CIRCLE":
      return `π × r² × H${c > 1 ? ` × تعداد` : ""}`;
    case "TRAPEZOID":
      return `((a + b) × H / 2) × L${c > 1 ? ` × تعداد` : ""}`;
    case "TRIANGLE":
      return `(W × H / 2) × L${c > 1 ? ` × تعداد` : ""}`;
    case "SLOPED_EXCAVATION":
      return `L×W×H + slope×H²×(L+W) + (4/3)×slope²×H³`;
    case "COUNT_ONLY":
      return `تعداد = ${c}`;
    default:
      return "";
  }
}

// تابع عمومی برای استفاده در سایر ماژول‌ها
export { computeShape, generateFormulaDisplay };
