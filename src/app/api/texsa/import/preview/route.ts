import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { db } from "@/lib/db";
import schemaData from "@/lib/texsa/schema.json";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/texsa/import/preview — Parse .svzt XML and return preview without committing
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

    // Count tables and rows
    const tableCounts: Record<string, number> = {};
    let totalRows = 0;
    const tableNames = Object.keys(root);

    for (const tableName of tableNames) {
      const tableData = root[tableName];
      if (Array.isArray(tableData)) {
        tableCounts[tableName] = tableData.length;
        totalRows += tableData.length;
      } else if (tableData && typeof tableData === "object") {
        tableCounts[tableName] = 1;
        totalRows += 1;
      } else {
        tableCounts[tableName] = 0;
      }
    }

    // Extract project info from brv_contract
    let projectInfo: any = {};
    const contractData = root.brv_contract;
    if (contractData) {
      const contract = Array.isArray(contractData) ? contractData[0] : contractData;
      projectInfo = {
        projectName: contract?.ctc_nmpj || "نامشخص",
        projectCode: contract?.ctc_id || "—",
        employer: contract?.ctc_nmci || "—",
        contractor: contract?.ctc_nmct || "—",
        consultant: contract?.ctc_nmcs || contract?.ctc_neza || "—",
        year: contract?.ctc_yrfh || "—",
        contractAmount: contract?.ctc_pric_prim || "—",
        version: contract?.Version || "—",
        location: contract?.ctc_place || "—",
      };
    }

    // Known tables from schema
    const knownTables = (schemaData as any).tables.map((t: any) => t.tableName);
    const foundTables = Object.keys(tableCounts);
    const unknownTables = foundTables.filter((t) => !knownTables.includes(t));
    const missingTables = knownTables.filter((t) => !foundTables.includes(t));

    // Generate warnings
    const warnings: string[] = [];
    if (unknownTables.length > 0) {
      warnings.push(`جداول ناشناخته: ${unknownTables.join(", ")}`);
    }
    if (!contractData) {
      warnings.push("جدول brv_contract پیدا نشد — اطلاعات پروژه قابل استخراج نیست");
    }

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      totalTables: foundTables.length,
      totalRows,
      tableCounts,
      projectInfo,
      unknownTables,
      missingTables,
      warnings,
      knownTablesCount: knownTables.length,
    });
  } catch (err: any) {
    console.error("Texsa import preview error:", err);
    return NextResponse.json(
      { error: err.message || "خطا در پردازش فایل" },
      { status: 500 }
    );
  }
}
