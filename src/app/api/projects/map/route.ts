import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects/map — داده‌های جغرافیایی پروژه‌ها برای نقشه
export async function GET() {
  const projects = await db.project.findMany({
    where: { tenantId: "tenant-demo" },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
      location: true,
      latitude: true,
      longitude: true,
      contractAmount: true,
      cachedTotal: true,
      cachedExecuted: true,
      year: true,
    },
  });

  // فیلتر فقط پروژه‌هایی که مختصات دارند
  const mappedProjects = projects
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => {
      const progress = p.contractAmount > 0
        ? Math.min(100, ((p.cachedExecuted || 0) / p.contractAmount) * 100)
        : 0;
      return {
        id: p.id,
        name: p.name,
        code: p.code,
        status: p.status,
        location: p.location,
        lat: p.latitude,
        lng: p.longitude,
        contractAmount: p.contractAmount,
        progress,
        year: p.year,
      };
    });

  // آمار
  const summary = {
    total: projects.length,
    mapped: mappedProjects.length,
    active: projects.filter((p) => p.status === "ACTIVE").length,
    draft: projects.filter((p) => p.status === "DRAFT").length,
    totalContract: projects.reduce((s, p) => s + p.contractAmount, 0),
    avgProgress:
      mappedProjects.length > 0
        ? mappedProjects.reduce((s, p) => s + p.progress, 0) / mappedProjects.length
        : 0,
  };

  return NextResponse.json({ projects: mappedProjects, summary });
}
