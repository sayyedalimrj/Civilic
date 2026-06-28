/**
 * contract.ts — normalize جدول brv_contract → Project.
 */
import { db } from "@/lib/db";
import { CONTRACT_FIELD_MAP } from "../table-map";
import { type NormalizeContext, num, type NormalizeStat } from "./context";

export interface NormalizedContract {
  stat: NormalizeStat;
  projectId?: string;
  facts: Record<string, string | number>;
}

export async function normalizeContract(ctx: NormalizeContext): Promise<NormalizedContract> {
  const rows = await ctx.readTable("brv_contract");
  if (!rows.length) {
    return { stat: { entity: "Project", created: 0, skipped: 0 }, facts: {} };
  }
  const f = rows[0].fields;
  const M = CONTRACT_FIELD_MAP;
  const facts = {
    name: f[M.projectName] ?? "پروژه‌ی بدون‌نام",
    employer: f[M.employerName] ?? "",
    consultant: f[M.supervisorName] || f[M.consultantShort] || "",
    contractor: f[M.contractorName] ?? "",
    contractNo: f[M.contractNo] ?? "",
    priceListYear: num(f[M.priceListYear]),
    contractAmount: num(f[M.contractAmount]),
    location: f[M.location] ?? "",
    texsaVersion: f[M.texsaVersion] ?? "",
    code: f[M.projectCode] ?? f[M.contractNo] ?? "",
  };

  const project = await db.project.create({
    data: {
      tenantId: ctx.tenantId,
      name: String(facts.name),
      code: String(facts.code) || `TX-${Date.now()}`,
      contractNo: String(facts.contractNo),
      year: Number(facts.priceListYear) || new Date().getFullYear() - 621,
      priceListYear: Number(facts.priceListYear) || null,
      contractAmount: Number(facts.contractAmount),
      location: String(facts.location),
      status: "ACTIVE",
      recordSource: "TEXSA",
      texsaImportId: ctx.importId,
    },
  });

  await db.texsaImport.update({ where: { id: ctx.importId }, data: { projectId: project.id } });

  return {
    stat: { entity: "Project", created: 1, skipped: 0 },
    projectId: project.id,
    facts,
  };
}
