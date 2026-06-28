"use client";

import ExcelJS from "exceljs";
import { toFa } from "@/lib/fa";

// ─── Export to Excel with formulas ──────────────────────────
export async function exportToExcel(
  filename: string,
  sheets: Array<{
    name: string;
    title: string;
    subtitle?: string;
    headers: string[];
    rows: Array<Array<string | number>>;
    totals?: Array<{ label: string; col: number; formula: string }>;
  }>
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "سیوان تدبیر تجارت";
  wb.created = new Date();

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name, {
      views: [{ rightToLeft: true, showGridLines: false }],
      properties: { defaultRowHeight: 20 },
    });

    // Title
    ws.mergeCells(`A1:${String.fromCharCode(64 + sheet.headers.length)}1`);
    const titleCell = ws.getCell("A1");
    titleCell.value = sheet.title;
    titleCell.font = { name: "B Nazanin", size: 16, bold: true, color: { argb: "FFB45309" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 32;

    // Subtitle
    if (sheet.subtitle) {
      ws.mergeCells(`A2:${String.fromCharCode(64 + sheet.headers.length)}2`);
      const subCell = ws.getCell("A2");
      subCell.value = sheet.subtitle;
      subCell.font = { name: "B Nazanin", size: 12, italic: true };
      subCell.alignment = { horizontal: "center" };
    }

    // Headers (row 4)
    const headerRow = ws.getRow(4);
    sheet.headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: "B Nazanin", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB45309" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      const b = { style: "thin" as const, color: { argb: "FFE5E7EB" } };
      cell.border = { top: b, bottom: b, left: b, right: b };
    });
    ws.getRow(4).height = 26;

    // Set column widths
    ws.columns = sheet.headers.map((h) => ({
      width: Math.max(12, Math.min(40, h.length * 1.5 + 4)),
    }));

    // Data rows
    const startRow = 5;
    sheet.rows.forEach((row, idx) => {
      const r = ws.getRow(startRow + idx);
      row.forEach((val, ci) => {
        const cell = r.getCell(ci + 1);
        cell.value = val;
        cell.font = { name: "B Nazanin", size: 10 };
        const b = { style: "thin" as const, color: { argb: "FFE5E7EB" } };
        cell.border = { top: b, bottom: b, left: b, right: b };
        if (typeof val === "number") {
          cell.alignment = { horizontal: "left" };
          cell.numFmt = "#,##0";
        } else {
          cell.alignment = { horizontal: "center" };
        }
      });
      // Alternating row color
      if (idx % 2 === 1) {
        for (let c = 1; c <= sheet.headers.length; c++) {
          r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7ED" } };
        }
      }
    });

    // Totals row
    if (sheet.totals && sheet.totals.length > 0) {
      const totalRow = startRow + sheet.rows.length;
      sheet.totals.forEach((t) => {
        ws.getCell(t.col + 1).value = { formula: t.formula };
        ws.getCell(t.col + 1).font = { name: "B Nazanin", size: 12, bold: true };
        ws.getCell(t.col + 1).numFmt = "#,##0";
        ws.getCell(t.col + 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFED7AA" } };
      });
      ws.getRow(totalRow).height = 28;
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${filename}.xlsx`);
}

// ─── Export to PDF (print-ready HTML) ───────────────────────
export function exportToPDF(
  filename: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  footnotes?: string[],
  parties?: { label: string; name: string }[]
) {
  const html = generatePrintHTML(title, subtitle, headers, rows, footnotes, parties);
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
  return true;
}

function generatePrintHTML(
  title: string,
  subtitle: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  footnotes?: string[],
  parties?: { label: string; name: string }[]
): string {
  const ths = headers.map((h) => `<th>${h}</th>`).join("");
  const trs = rows
    .map(
      (r) =>
        `<tr>${r
          .map((v) =>
            typeof v === "number"
              ? `<td class="num">${(v as number).toLocaleString("en-US")}</td>`
              : `<td>${v}</td>`
          )
          .join("")}</tr>`
    )
    .join("");

  const partiesHTML = parties
    ? `<div class="parties">
        ${parties.map((p) => `<div class="party"><div class="party-label">${p.label}</div><div>${p.name}</div></div>`).join("")}
      </div>`
    : "";

  const footnotesHTML = footnotes
    ? `<div class="footnotes">
        <h3>تذکرات</h3>
        <ol>${footnotes.map((f) => `<li>${f}</li>`).join("")}</ol>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { size: A4 landscape; margin: 1cm; }
  body { font-family: 'Vazirmatn', 'B Nazanin', Tahoma, sans-serif; color: #1e293b; font-size: 10pt; }
  .header { text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 10px; margin-bottom: 15px; }
  .header h1 { color: #b45309; margin: 0 0 5px; font-size: 18px; }
  .header p { margin: 2px 0; font-size: 11px; color: #64748b; }
  .parties { display: grid; grid-template-columns: repeat(${parties?.length || 4}, 1fr); gap: 10px; margin: 15px 0; }
  .party { border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; font-size: 11px; }
  .party-label { color: #64748b; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
  th { background: #d97706; color: white; padding: 6px; text-align: center; border: 1px solid #b45309; }
  td { padding: 5px; border: 1px solid #cbd5e1; text-align: center; }
  td.num { text-align: left; font-family: 'Tahoma', monospace; }
  .footnotes { margin-top: 15px; padding: 10px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 4px; font-size: 10px; }
  .footnotes h3 { margin: 0 0 8px; color: #b45309; font-size: 12px; }
  .signatures { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 30px; padding-top: 20px; }
  .sig { text-align: center; font-size: 10px; }
  .sig-line { border-top: 1px solid #475569; margin-top: 30px; padding-top: 5px; }
</style>
</head>
<body>
  <div class="header">
    <h1>سیوان تدبیر تجارت</h1>
    <p><strong>${title}</strong></p>
    <p>${subtitle}</p>
  </div>
  ${partiesHTML}
  <table>
    <thead><tr>${ths}</tr></thead>
    <tbody>${trs}</tbody>
  </table>
  ${footnotesHTML}
  <div class="signatures">
    <div class="sig"><div class="sig-line">کارفرما</div></div>
    <div class="sig"><div class="sig-line">مشاور</div></div>
    <div class="sig"><div class="sig-line">ناظر</div></div>
    <div class="sig"><div class="sig-line">پیمانکار</div></div>
  </div>
</body>
</html>`;
}

// ─── Export to CSV ──────────────────────────────────────────
export function exportToCSV(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const csvRows = [
    headers.map(csvCell).join(","),
    ...rows.map((r) => r.map(csvCell).join(",")),
  ];
  const csv = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `${filename}.csv`);
}

function csvCell(s: string | number): string {
  const esc = String(s).replace(/"/g, '""');
  return /[",\n]/.test(esc) ? `"${esc}"` : esc;
}

// ─── Trigger download ───────────────────────────────────────
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
