/**
 * parties.ts — normalize طرفین (brv_contract نام‌ها + base_PersonalityTyp + brv_type)
 * → Organization + ProjectParty.
 */
import { db } from "@/lib/db";
import { CONTRACT_FIELD_MAP } from "../table-map";
import { type NormalizeContext, type NormalizeStat } from "./context";

export async function normalizeParties(
  ctx: NormalizeContext,
  projectId: string
): Promise<NormalizeStat> {
  const contractRows = await ctx.readTable("brv_contract");
  if (!contractRows.length) return { entity: "ProjectParty", created: 0, skipped: 0 };
  const f = contractRows[0].fields;
  const M = CONTRACT_FIELD_MAP;

  const defs: { type: "EMPLOYER" | "CONSULTANT" | "CONTRACTOR"; name: string }[] = [
    { type: "EMPLOYER", name: f[M.employerName] || "کارفرما" },
    { type: "CONSULTANT", name: f[M.supervisorName] || f[M.consultantShort] || "مشاور" },
    { type: "CONTRACTOR", name: f[M.contractorName] || "پیمانکار" },
  ];

  let created = 0;
  for (const d of defs) {
    let org = await db.organization.findFirst({ where: { tenantId: ctx.tenantId, name: d.name } });
    if (!org) {
      org = await db.organization.create({
        data: { tenantId: ctx.tenantId, name: d.name, type: d.type },
      });
    }
    await db.projectParty.create({
      data: {
        projectId,
        organizationId: org.id,
        partyType: d.type,
        displayTitle: `${d.type === "EMPLOYER" ? "کارفرما" : d.type === "CONSULTANT" ? "مشاور" : "پیمانکار"} — ${d.name}`,
        isPrimary: true,
      },
    });
    created += 1;
  }
  return { entity: "ProjectParty", created, skipped: 0 };
}
