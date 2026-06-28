/**
 * deductions.ts — normalize brv_kosorat → خلاصه‌ی کسورات پروژه.
 * کسورات به‌صورت پارامتر روی صورت‌وضعیت محاسبه می‌شوند؛ اینجا فهرست منحصربه‌فرد نام کسور استخراج
 * و به‌صورت JSON روی Project.coefficients نگه داشته می‌شود (داده‌ی خام در mirror حفظ است).
 */
import { db } from "@/lib/db";
import { DEDUCTION_FIELD_MAP } from "../table-map";
import { type NormalizeContext, num, type NormalizeStat } from "./context";

export async function normalizeDeductions(
  ctx: NormalizeContext,
  projectId: string
): Promise<NormalizeStat> {
  const rows = await ctx.readTable("brv_kosorat");
  if (!rows.length) return { entity: "Deduction", created: 0, skipped: 0 };
  const M = DEDUCTION_FIELD_MAP;

  const names = new Map<string, { percent: number; sign: string }>();
  for (const r of rows) {
    const name = r.fields[M.name];
    if (!name || names.has(name)) continue;
    names.set(name, { percent: num(r.fields[M.percent]), sign: r.fields[M.sign] || "-" });
  }

  const project = await db.project.findUnique({ where: { id: projectId } });
  let coeff: Record<string, unknown> = {};
  try {
    coeff = project?.coefficients ? JSON.parse(project.coefficients) : {};
  } catch {
    coeff = {};
  }
  coeff.deductions = Array.from(names.entries()).map(([name, v]) => ({ name, ...v }));
  await db.project.update({ where: { id: projectId }, data: { coefficients: JSON.stringify(coeff) } });

  return { entity: "Deduction", created: names.size, skipped: rows.length - names.size };
}
