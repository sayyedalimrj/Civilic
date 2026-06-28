/**
 * texsa-import-local.ts — import فایل .svzt از workspace در dev و normalize به پروژه‌ی Civilic.
 * اجرا: `bun .zscripts/texsa-import-local.ts [path-to-file.svzt]`
 * نیازمند DATABASE_URL به یک PostgreSQL.
 */
import { importLocalSvzt } from "../src/lib/texsa/import/import-local";
import { normalizeImport } from "../src/lib/texsa/normalize";
import { generateRoundTripReport } from "../src/lib/texsa/export/roundtrip-report";
import { db } from "../src/lib/db";

async function main() {
  const file = process.argv[2] || "Important project.svzt";
  console.log(`📥 import محلی: ${file}`);

  const tenant = (await db.tenant.findFirst()) ?? (await db.tenant.create({ data: { name: "Civilic" } }));

  const result = await importLocalSvzt(file);
  console.log(`✅ parse شد: ${result.totalTables} جدول، ${result.totalRows} ردیف`);
  console.log(`   پروژه: ${result.projectName ?? "—"} | نسخه تکسا: ${result.texsaVersion ?? "—"}`);

  const norm = await normalizeImport(result.importId, tenant.id);
  console.log("📊 normalize:");
  for (const s of norm.stats) console.log(`   - ${s.entity}: ساخته‌شده ${s.created}، رد ${s.skipped}`);

  const report = await generateRoundTripReport(result.importId);
  console.log(`🔁 گزارش round-trip: سازگاری ${report.compatibilityPct}% | ردیف خام ${report.importedRowCount} | موجودیت نرمال‌شده ${report.normalizedEntities}`);
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
