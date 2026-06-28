/**
 * texsa-export-test.ts — تست export: بازسازی NewDataSet از آخرین import و سریال‌سازی به XML.
 * اجرا: `bun .zscripts/texsa-export-test.ts [importId]`
 */
import { buildNewDataSet } from "../src/lib/texsa/export/build-newdataset";
import { serializeNewDataSet } from "../src/lib/texsa/export/serialize-xml";
import { db } from "../src/lib/db";
import { writeFileSync } from "node:fs";

async function main() {
  const importId =
    process.argv[2] || (await db.texsaImport.findFirst({ orderBy: { createdAt: "desc" } }))?.id;
  if (!importId) {
    console.error("هیچ import یافت نشد. ابتدا texsa:import:local را اجرا کنید.");
    process.exit(1);
  }
  const built = await buildNewDataSet(importId, "ROUND_TRIP_RAW");
  const xml = serializeNewDataSet(built.tables);
  const out = "download/export-test.svzt";
  writeFileSync(out, xml, "utf-8");
  console.log(`✅ export شد: ${built.tableCount} جدول، ${built.rowCount} ردیف → ${out} (${xml.length} بایت)`);
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
