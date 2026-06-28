"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileBarChart,
  Download,
  Printer,
  TrendingUp,
  Info,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/lib/store";
import { faMoney, faRial, faPct, toFa, toJalali } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";

interface AdjustmentRow {
  id: string;
  periodLabel: string;
  chapterNo: number;
  workPeriodAmount: number;
  durationRatio: number;
  baseIndex: number;
  currentIndex: number;
  adjustmentFactor: number;
  previousAmount: number;
  currentAmount: number;
  diffAmount: number;
  adjustmentAmount: number;
  adjustmentType: string;
  notes: string | null;
}

interface AdjustmentReportData {
  project: {
    id: string;
    name: string;
    code: string;
    contractAmount: number;
    contractDate: string | null;
  };
  tenant: {
    name: string;
    logoUrl: string | null;
  };
  rows: AdjustmentRow[];
  indices: any[];
  footnotes: string[];
  parties: {
    employer: { name: string };
    consultant: { name: string };
    supervisor: { name: string };
    contractor: { name: string };
  };
  type: string;
}

const TYPE_LABELS: Record<string, string> = {
  TEMPORARY: "تعدیل موقت",
  FINAL: "تعدیل قطعی",
  REVERSE: "تعدیل معکوس",
};

const TYPE_COLORS: Record<string, string> = {
  TEMPORARY: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  FINAL: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  REVERSE: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

export function AdjustmentReportView() {
  const { selectedProjectId } = useAppStore();
  const { toast } = useToast();
  const [type, setType] = useState<"TEMPORARY" | "FINAL" | "REVERSE">("TEMPORARY");

  const { data, isLoading } = useQuery<AdjustmentReportData>({
    queryKey: ["adjustment-report", selectedProjectId, type],
    queryFn: async () => {
      const r = await fetch(
        `/api/projects/${selectedProjectId}/adjustment-report?type=${type}`
      );
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  const handlePrint = () => {
    if (!data) return;
    const html = generatePrintHtml(data);
    const w = window.open("", "_blank");
    if (!w) {
      toast({ title: "باز شدن پنجره چاپ مسدود شد", variant: "destructive" });
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  const handleExportExcel = () => {
    toast({ title: "خروجی Excel در حال آماده‌سازی..." });
    // خروجی اکسل ساده — در نسخه‌ی بعدی با exceljs کامل می‌شود
    if (!data) return;
    const rows = data.rows;
    const headers = [
      "فصل",
      "دوره کارکرد",
      "مبلغ کارکرد دوره",
      "نسبت مدت",
      "شاخص مبنا",
      "شاخص کارکرد",
      "ضریب تعدیل",
      "مبلغ قبلی",
      "مبلغ فعلی",
      "مابه‌التفاوت",
      "مبلغ تعدیل",
    ];
    const csv = "\uFEFF" + [
      headers.join(","),
      ...rows.map((r) =>
        [
          toFa(r.chapterNo),
          r.periodLabel,
          r.workPeriodAmount,
          r.durationRatio,
          r.baseIndex,
          r.currentIndex,
          r.adjustmentFactor.toFixed(4),
          r.previousAmount,
          r.currentAmount,
          r.diffAmount,
          r.adjustmentAmount,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adjustment-${type}-${data.project.code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "خروجی Excel دانلود شد" });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileBarChart className="size-5 text-amber-600" />
            گزارش تعدیل ({TYPE_LABELS[type]})
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            گزارش مستقل تعدیل — جدا از فرم اصلی صورت‌وضعیت
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5"
            onClick={handleExportExcel}
            disabled={!data}
          >
            <Download className="size-4" />
            خروجی Excel
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
            onClick={handlePrint}
            disabled={!data}
          >
            <Printer className="size-4" />
            چاپ PDF
          </Button>
        </div>
      </div>

      {/* Type selector */}
      <div className="flex gap-2">
        {(["TEMPORARY", "FINAL", "REVERSE"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              type === t
                ? "bg-amber-600 text-white"
                : "bg-card border hover:bg-muted/50"
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="p-12 text-center text-xs text-muted-foreground">
            داده‌ای برای نمایش وجود ندارد
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Project info */}
          <Card className="border-0 shadow-sm bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem label="پروژه" value={data.project.name} />
                <InfoItem label="کد پروژه" value={data.project.code} />
                <InfoItem label="مبلغ پیمان" value={faRial(data.project.contractAmount)} />
                <InfoItem label="تاریخ پیمان" value={data.project.contractDate ? toJalali(data.project.contractDate) : "—"} />
              </div>
            </CardContent>
          </Card>

          {/* Parties */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="size-4 text-amber-600" />
                مشخصات طرفین
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <PartyCard label="کارفرما" name={data.parties.employer.name} color="amber" />
                <PartyCard label="مشاور" name={data.parties.consultant.name} color="blue" />
                <PartyCard label="ناظر" name={data.parties.supervisor.name} color="emerald" />
                <PartyCard label="پیمانکار" name={data.parties.contractor.name} color="orange" />
              </div>
            </CardContent>
          </Card>

          {/* Adjustment table */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-amber-600" />
                  جدول تفکیک‌شده‌ی تعدیل
                </span>
                <Badge className={TYPE_COLORS[type]}>
                  {TYPE_LABELS[type]}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="text-xs">فصل</TableHead>
                      <TableHead className="text-xs">دوره کارکرد</TableHead>
                      <TableHead className="text-xs text-left">مبلغ کارکرد دوره</TableHead>
                      <TableHead className="text-xs text-left">نسبت مدت</TableHead>
                      <TableHead className="text-xs text-left">شاخص مبنا</TableHead>
                      <TableHead className="text-xs text-left">شاخص کارکرد</TableHead>
                      <TableHead className="text-xs text-left">ضریب تعدیل</TableHead>
                      <TableHead className="text-xs text-left">مبلغ قبلی</TableHead>
                      <TableHead className="text-xs text-left">مبلغ فعلی</TableHead>
                      <TableHead className="text-xs text-left">مابه‌التفاوت</TableHead>
                      <TableHead className="text-xs text-left">مبلغ تعدیل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((r) => (
                      <TableRow key={r.id} className="text-xs">
                        <TableCell className="font-bold">{toFa(r.chapterNo)}</TableCell>
                        <TableCell>{r.periodLabel}</TableCell>
                        <TableCell className="text-left tabular-nums">{faMoney(r.workPeriodAmount)}</TableCell>
                        <TableCell className="text-left tabular-nums">{toFa(r.durationRatio.toFixed(2))}</TableCell>
                        <TableCell className="text-left tabular-nums">{toFa(r.baseIndex.toFixed(2))}</TableCell>
                        <TableCell className="text-left tabular-nums">{toFa(r.currentIndex.toFixed(2))}</TableCell>
                        <TableCell className="text-left tabular-nums text-amber-600 font-bold">
                          {toFa(r.adjustmentFactor.toFixed(4))}
                        </TableCell>
                        <TableCell className="text-left tabular-nums text-muted-foreground">{faMoney(r.previousAmount)}</TableCell>
                        <TableCell className="text-left tabular-nums">{faMoney(r.currentAmount)}</TableCell>
                        <TableCell className="text-left tabular-nums text-orange-600">{faMoney(r.diffAmount)}</TableCell>
                        <TableCell className="text-left tabular-nums font-bold text-emerald-600">
                          {faMoney(r.adjustmentAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total row */}
                    <TableRow className="bg-amber-50 dark:bg-amber-950/30 font-bold">
                      <TableCell colSpan={2} className="text-xs">
                        جمع کل
                      </TableCell>
                      <TableCell className="text-left tabular-nums text-xs">
                        {faMoney(data.rows.reduce((s, r) => s + r.workPeriodAmount, 0))}
                      </TableCell>
                      <TableCell colSpan={5} />
                      <TableCell className="text-left tabular-nums text-xs">
                        {faMoney(data.rows.reduce((s, r) => s + r.currentAmount, 0))}
                      </TableCell>
                      <TableCell className="text-left tabular-nums text-xs text-orange-600">
                        {faMoney(data.rows.reduce((s, r) => s + r.diffAmount, 0))}
                      </TableCell>
                      <TableCell className="text-left tabular-nums text-xs text-emerald-600">
                        {faMoney(data.rows.reduce((s, r) => s + r.adjustmentAmount, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Footnotes */}
          <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="size-4 text-amber-600" />
                پاورقی قانونی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {data.footnotes.map((fn, i) => (
                <div key={i} className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-1.5">
                  <span className="text-amber-600 mt-0.5">{toFa(i + 1)}.</span>
                  <span>{fn}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}

function PartyCard({ label, name, color }: { label: string; name: string; color: string }) {
  const colors: Record<string, string> = {
    amber: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    orange: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
  };
  return (
    <div className={`rounded-md border p-3 ${colors[color]}`}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-1">{name}</div>
    </div>
  );
}

function generatePrintHtml(data: AdjustmentReportData): string {
  const typeLabel = TYPE_LABELS[data.type] || data.type;
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<title>گزارش تعدیل — ${data.project.name}</title>
<style>
  @page { size: A4 landscape; margin: 1cm; }
  body { font-family: 'Vazirmatn', 'B Nazanin', Tahoma, sans-serif; color: #1e293b; }
  .header { text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 10px; margin-bottom: 15px; }
  .header h1 { color: #b45309; margin: 0 0 5px; font-size: 18px; }
  .header p { margin: 2px 0; font-size: 12px; color: #64748b; }
  .parties { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin: 15px 0; }
  .party { border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; font-size: 11px; }
  .party-label { color: #64748b; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
  th { background: #d97706; color: white; padding: 6px; text-align: center; border: 1px solid #b45309; }
  td { padding: 5px; border: 1px solid #cbd5e1; text-align: center; }
  td.num { text-align: left; font-family: 'Tahoma', monospace; }
  .total { background: #fef3c7; font-weight: bold; }
  .footnotes { margin-top: 15px; padding: 10px; background: #fef3c7; border: 1px solid #fbbf24; border-radius: 4px; font-size: 10px; }
  .footnotes h3 { margin: 0 0 8px; color: #b45309; font-size: 12px; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-top: 30px; padding-top: 20px; }
  .sig { text-align: center; font-size: 10px; }
  .sig-line { border-top: 1px solid #475569; margin-top: 30px; padding-top: 5px; }
</style>
</head>
<body>
  <div class="header">
    <h1>${data.tenant.name}</h1>
    <p><strong>گزارش ${typeLabel}</strong></p>
    <p>پروژه: ${data.project.name} — کد: ${data.project.code}</p>
    <p>مبلغ پیمان: ${data.project.contractAmount.toLocaleString("en-US")} ریال</p>
  </div>

  <div class="parties">
    <div class="party"><div class="party-label">کارفرما</div><div>${data.parties.employer.name}</div></div>
    <div class="party"><div class="party-label">مشاور</div><div>${data.parties.consultant.name}</div></div>
    <div class="party"><div class="party-label">ناظر</div><div>${data.parties.supervisor.name}</div></div>
    <div class="party"><div class="party-label">پیمانکار</div><div>${data.parties.contractor.name}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>فصل</th>
        <th>دوره کارکرد</th>
        <th>مبلغ کارکرد دوره</th>
        <th>نسبت مدت</th>
        <th>شاخص مبنا</th>
        <th>شاخص کارکرد</th>
        <th>ضریب تعدیل</th>
        <th>مبلغ قبلی</th>
        <th>مبلغ فعلی</th>
        <th>مابه‌التفاوت</th>
        <th>مبلغ تعدیل</th>
      </tr>
    </thead>
    <tbody>
      ${data.rows
        .map(
          (r) => `<tr>
        <td>${toFa(r.chapterNo)}</td>
        <td>${r.periodLabel}</td>
        <td class="num">${r.workPeriodAmount.toLocaleString("en-US")}</td>
        <td class="num">${r.durationRatio.toFixed(2)}</td>
        <td class="num">${r.baseIndex.toFixed(2)}</td>
        <td class="num">${r.currentIndex.toFixed(2)}</td>
        <td class="num">${r.adjustmentFactor.toFixed(4)}</td>
        <td class="num">${r.previousAmount.toLocaleString("en-US")}</td>
        <td class="num">${r.currentAmount.toLocaleString("en-US")}</td>
        <td class="num">${r.diffAmount.toLocaleString("en-US")}</td>
        <td class="num">${r.adjustmentAmount.toLocaleString("en-US")}</td>
      </tr>`
        )
        .join("")}
      <tr class="total">
        <td colspan="2">جمع کل</td>
        <td class="num">${data.rows.reduce((s, r) => s + r.workPeriodAmount, 0).toLocaleString("en-US")}</td>
        <td colspan="5"></td>
        <td class="num">${data.rows.reduce((s, r) => s + r.currentAmount, 0).toLocaleString("en-US")}</td>
        <td class="num">${data.rows.reduce((s, r) => s + r.diffAmount, 0).toLocaleString("en-US")}</td>
        <td class="num">${data.rows.reduce((s, r) => s + r.adjustmentAmount, 0).toLocaleString("en-US")}</td>
      </tr>
    </tbody>
  </table>

  <div class="footnotes">
    <h3>تذکرات قانونی</h3>
    <ol>
      ${data.footnotes.map((fn) => `<li>${fn}</li>`).join("")}
    </ol>
  </div>

  <div class="signatures">
    <div class="sig"><div class="sig-line">کارفرما</div></div>
    <div class="sig"><div class="sig-line">مشاور</div></div>
    <div class="sig"><div class="sig-line">ناظر</div></div>
    <div class="sig"><div class="sig-line">پیمانکار</div></div>
  </div>
</body>
</html>`;
}
