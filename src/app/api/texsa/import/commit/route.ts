import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { db } from "@/lib/db";
import schemaData from "@/lib/texsa/schema.json";

export const runtime = "nodejs";
export const maxDuration = 300;

// Model name mapping from table name to Prisma model
const TABLE_TO_MODEL: Record<string, string> = {};
(schemaData as any).tables.forEach((t: any) => {
  const modelName = t.tableName[0].toUpperCase() + t.tableName.slice(1);
  TABLE_TO_MODEL[t.tableName] = modelName;
});

// POST /api/texsa/import/commit — Parse and commit .svzt to database
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "فایل الزامی است" }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const xmlContent = Buffer.from(fileBuffer).toString("utf-8");

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseTagValue: false,
      trimValues: true,
    });

    let parsed;
    try {
      parsed = parser.parse(xmlContent);
    } catch (e: any) {
      return NextResponse.json(
        { error: "خطا در پارس XML: " + e.message },
        { status: 400 }
      );
    }

    const root = parsed?.NewDataSet;
    if (!root) {
      return NextResponse.json(
        { error: "root باید NewDataSet باشد" },
        { status: 400 }
      );
    }

    // Extract project info
    let projectInfo: any = {};
    const contractData = root.brv_contract;
    if (contractData) {
      const contract = Array.isArray(contractData) ? contractData[0] : contractData;
      projectInfo = {
        projectName: contract?.ctc_nmpj || file.name,
        projectCode: contract?.ctc_id || "",
      };
    }

    // Create import record
    const importRecord = await db.texsaImport.create({
      data: {
        originalFileName: file.name,
        fileSizeBytes: file.size,
        projectCode: projectInfo.projectCode || null,
        projectName: projectInfo.projectName || null,
        status: "PARSING",
      },
    });

    const importId = importRecord.id;

    // Process each table
    const tableCounts: Record<string, number> = {};
    let totalRows = 0;
    const issues: any[] = [];
    const knownTables = (schemaData as any).tables as any[];
    const knownTableNames = knownTables.map((t) => t.tableName);
    const knownColumnsMap = new Map<string, Set<string>>();
    knownTables.forEach((t) => {
      knownColumnsMap.set(t.tableName, new Set(t.columns.map((c: any) => c.name)));
    });

    for (const tableName of Object.keys(root)) {
      const tableData = root[tableName];
      const rows = Array.isArray(tableData) ? tableData : [tableData];
      const rowCount = rows.filter((r) => r && typeof r === "object").length;
      tableCounts[tableName] = rowCount;
      totalRows += rowCount;

      // Check if table is known
      if (!knownTableNames.includes(tableName)) {
        issues.push({
          severity: "INFO",
          tableName,
          message: `جدول ناشناخته: ${tableName} با ${rowCount} ردیف`,
        });
      }

      const knownCols = knownColumnsMap.get(tableName);
      const modelName = TABLE_TO_MODEL[tableName];

      if (!modelName) {
        // Unknown table — skip (could store in rawJson later)
        continue;
      }

      // Batch insert
      const batchData: any[] = [];
      rows.forEach((row: any, idx: number) => {
        if (!row || typeof row !== "object") return;

        const fieldData: any = {};
        const unknownFields: any = {};

        for (const [key, value] of Object.entries(row)) {
          // Skip #text or attributes
          if (key === "#text") continue;

          const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, "_");
          const fieldName = `tx_${sanitizedKey}`;

          if (knownCols && knownCols.has(key)) {
            fieldData[fieldName] = value != null ? String(value) : null;
          } else {
            unknownFields[key] = value;
          }
        }

        batchData.push({
          importId,
          rowOrder: idx,
          ...fieldData,
          rawJson: JSON.stringify(unknownFields),
        });
      });

      // Insert in batches of 500
      const batchSize = 500;
      try {
        const model = (db as any)[modelName];
        if (!model) {
          issues.push({
            severity: "WARNING",
            tableName,
            message: `مدل Prisma برای ${tableName} یافت نشد`,
          });
          continue;
        }

        for (let i = 0; i < batchData.length; i += batchSize) {
          const batch = batchData.slice(i, i + batchSize);
          await model.createMany({ data: batch });
        }

        // Log unknown fields
        if (knownCols) {
          const allKeys = new Set<string>();
          rows.forEach((r: any) => {
            if (r && typeof r === "object") {
              Object.keys(r).forEach((k) => {
                if (k !== "#text" && !knownCols.has(k)) allKeys.add(k);
              });
            }
          });
          if (allKeys.size > 0) {
            issues.push({
              severity: "INFO",
              tableName,
              message: `ستون‌های ناشناخته در ${tableName}: ${Array.from(allKeys).join(", ")}`,
            });
          }
        }
      } catch (err: any) {
        issues.push({
          severity: "ERROR",
          tableName,
          message: `خطا در ذخیره ${tableName}: ${err.message}`,
        });
      }
    }

    // Update import record
    await db.texsaImport.update({
      where: { id: importId },
      data: {
        status: "READY",
        totalTables: Object.keys(tableCounts).length,
        totalRows,
        tableCountsJson: JSON.stringify(tableCounts),
        warningsJson: JSON.stringify(issues.filter((i) => i.severity === "WARNING" || i.severity === "INFO")),
        errorsJson: JSON.stringify(issues.filter((i) => i.severity === "ERROR")),
      },
    });

    // Store issues
    for (const issue of issues) {
      await db.texsaImportIssue.create({
        data: {
          importId,
          ...issue,
          rawJson: JSON.stringify({}),
        },
      });
    }

    return NextResponse.json({
      importId,
      status: "READY",
      totalTables: Object.keys(tableCounts).length,
      totalRows,
      tableCounts,
      issuesCount: issues.length,
      projectInfo,
    });
  } catch (err: any) {
    console.error("Texsa import commit error:", err);
    return NextResponse.json(
      { error: err.message || "خطا در پردازش فایل" },
      { status: 500 }
    );
  }
}
