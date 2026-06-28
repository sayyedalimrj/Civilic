import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects — لیست پروژه‌های tenant
export async function GET() {
  const projects = await db.project.findMany({
    where: { tenantId: "tenant-demo" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          detailBoqs: true,
          financialSheet: true,
          payments: true,
        },
      },
    },
  });
  return NextResponse.json({ projects });
}

// POST /api/projects — ایجاد پروژه
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name,
    code,
    documentCode,
    year,
    priceListId,
    contractAmount,
    contractDate,
    location,
    description,
    coefficients,
    status,
  } = body;

  const project = await db.project.create({
    data: {
      tenantId: "tenant-demo",
      name,
      code,
      documentCode,
      year: Number(year),
      priceListId: priceListId || null,
      contractAmount: Number(contractAmount) || 0,
      contractDate: contractDate ? new Date(contractDate) : null,
      location,
      description,
      coefficients: JSON.stringify(
        coefficients || {
          general: 1.0,
          regional: 1.12,
          altitude: 1.0,
          floors: 1.0,
          tunnelHardship: 1.0,
        }
      ),
      status: status === "ACTIVE" ? "ACTIVE" : "DRAFT",
    },
  });
  return NextResponse.json({ project }, { status: 201 });
}
