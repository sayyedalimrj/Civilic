"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  FileSpreadsheet,
  FileBarChart,
  FileCode,
  TrendingUp,
  BookOpen,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronDown,
  Building2,
  PenLine,
  ScrollText,
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import { faNum, faMoney, faRial, faPct, toFa } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ───────────────────────────────────────────────────────────
interface FinancialSheetItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  chapterNo: number;
}

interface Chapter {
  id: string;
  chapterNo: number;
  title: string;
  amount: number;
  percent: number;
}

interface PaymentItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  totalQuantity: number;
  executedQuantity: number;
  executedPercent: number;
  unitPrice: number;
  executedAmount: number;
  adjustedAmount: number;
  isAdjusted: boolean;
}

interface Payment {
  id: string;
  periodNo: number;
  status: string;
  guaranteePct: number;
  insurancePct: number;
  taxPct: number;
  executedAmount: number;
  guarantee: number;
  insurance: number;
  tax: number;
  netPayable: number;
  items: PaymentItem[];
}

interface ReportProject {
  id: string;
  name: string;
  code: string;
  year: number;
  contractAmount: number;
  location: string | null;
  status: string;
  tenant?: { name: string; logoUrl?: string | null } | null;
  financialSheet: FinancialSheetItem[];
  chapters: Chapter[];
  payments: Payment[];
}

interface WBSNode {
  code: string;
  title: string;
  amount: number;
  children: WBSNode[];
}

interface ReportResponse {
  project: ReportProject;
  wbs?: WBSNode;
}

interface TenantResponse {
  tenant: {
    id: string;
    name: string;
    logoUrl: string | null;
    signatures: string;
  } | null;
}

// ─── Report Catalog ──────────────────────────────────────────────────
type ReportType = "financial" | "payment" | "boq" | "wbs" | "adjustment" | "chapters";

interface ReportCardDef {
  type: ReportType;
  title: string;
  description: string;
  format: "PDF" | "Word" | "Excel" | "XML";
  icon: typeof FileText;
  color: string;
  apiType?: "financial" | "payment" | "wbs";
}

const REPORT_CATALOG: ReportCardDef[] = [
  {
    type: "financial",
    title: "برگه مالی استاندارد",
    description: "خروجی استاندارد برگه مالی پروژه با سربرگ سازمان و امضاها",
    format: "PDF",
    icon: FileText,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    apiType: "financial",
  },
  {
    type: "payment",
    title: "صورت‌وضعیت رسمی",
    description: "صورت‌وضعیت دوره‌های مختلف همراه با کسورات قانونی",
    format: "PDF",
    icon: FileBarChart,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    apiType: "payment",
  },
  {
    type: "boq",
    title: "گزارش متره",
    description: "گزارش کامل ریزمتره و خلاصه‌متره به‌همراه قیمت‌ها",
    format: "Excel",
    icon: FileSpreadsheet,
    color: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    apiType: "financial",
  },
  {
    type: "wbs",
    title: "ساختار شکست کار (WBS)",
    description: "خروجی XML سازگار با MS Project بر اساس کدهای آیتم‌ها",
    format: "XML",
    icon: FileCode,
    color: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    apiType: "wbs",
  },
  {
    type: "adjustment",
    title: "گزارش تعدیل",
    description: "گزارش تفصیلی تعدیل صورت‌وضعیت با شاخص‌های پایه و جاری",
    format: "PDF",
    icon: TrendingUp,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    apiType: "payment",
  },
  {
    type: "chapters",
    title: "گزارش فصول",
    description: "توزیع مبالغ روی فصول استاندارد به‌همراه نمودار و درصدها",
    format: "PDF",
    icon: BookOpen,
    color: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    apiType: "financial",
  },
];

// ─── Main View ───────────────────────────────────────────────────────
export function ReportsView() {
  const projectId = useAppStore((s) => s.selectedProjectId);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ReportResponse>({
    queryKey: ["report", projectId, "wbs"],
    queryFn: async () => {
      const r = await fetch(`/api/reports/project/${projectId}?type=wbs`);
      if (!r.ok) throw new Error("بارگذاری گزارش ناموفق بود");
      return r.json();
    },
    enabled: !!projectId,
  });

  const { data: tenantData } = useQuery<TenantResponse>({
    queryKey: ["tenant"],
    queryFn: async () => {
      const r = await fetch("/api/tenant");
      return r.json();
    },
  });

  const handleDownload = async (report: ReportCardDef) => {
    if (!projectId) return;
    try {
      if (report.type === "wbs") {
        await downloadWBS(projectId, report);
      } else if (report.type === "boq") {
        await downloadBoqExcel(projectId, report);
      } else {
        await printReport(projectId, report, tenantData?.tenant?.name || "سازمان پیمان");
      }
      toast({
        title: "خروجی آماده شد",
        description: (
          <span className="text-xs leading-5">
            گزارش «<b>{report.title}</b>» با موفقیت آماده شد.
          </span>
        ),
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "خطا در تولید خروجی",
        description: err instanceof Error ? err.message : "خطای ناشناخته",
      });
    }
  };

  if (!projectId) {
    return (
      <EmptyState
        icon={<FileBarChart className="size-8" />}
        title="پروژه‌ای انتخاب نشده"
        description="یک پروژه را از نوار کناری انتخاب کنید تا گزارشات آن قابل دریافت باشد."
      />
    );
  }

  if (isLoading) return <ReportsSkeleton />;

  if (isError) {
    return (
      <EmptyState
        icon={<RefreshCw className="size-8" />}
        title="خطا در بارگذاری"
        description="بارگذاری گزارش‌ها ناموفق بود."
        action={
          <Button variant="outline" className="h-9" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            تلاش مجدد
          </Button>
        }
      />
    );
  }

  const project = data?.project;
  const wbs = data?.wbs;
  const tenantName = tenantData?.tenant?.name || project?.tenant?.name || "سازمان پیمان";

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <FileBarChart className="size-5 text-amber-600" />
            گزارشات و خروجی‌ها
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            پروژه: <span className="font-medium text-foreground">{project?.name}</span>{" "}
            <span className="font-mono">({toFa(project?.code || "")})</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => {
            qc.invalidateQueries({ queryKey: ["report", projectId, "wbs"] });
            refetch();
          }}
          disabled={isFetching}
        >
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          بازخوانی
        </Button>
      </div>

      {/* Report cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_CATALOG.map((r) => (
          <ReportCard
            key={r.type}
            report={r}
            onDownload={() => handleDownload(r)}
          />
        ))}
      </div>

      {/* Two-column: WBS preview + Letterhead */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WbsPreview wbs={wbs} />
        <LetterheadPreview
          tenantName={tenantName}
          signatures={tenantData?.tenant?.signatures || "[]"}
        />
      </div>
    </div>
  );
}

// ─── Report Card ─────────────────────────────────────────────────────
function ReportCard({
  report,
  onDownload,
}: {
  report: ReportCardDef;
  onDownload: () => void;
}) {
  const Icon = report.icon;
  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className={cn("flex size-11 items-center justify-center rounded-xl", report.color)}>
            <Icon className="size-5" />
          </div>
          <Badge variant="outline" className="text-[10px]">
            {report.format}
          </Badge>
        </div>
        <CardTitle className="mt-2 text-sm">{report.title}</CardTitle>
        <CardDescription className="text-[11px] leading-5">
          {report.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <Button
          size="sm"
          variant="outline"
          className="h-9 w-full gap-1.5"
          onClick={onDownload}
        >
          <Download className="size-4" />
          دانلود
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── WBS Preview ─────────────────────────────────────────────────────
function WbsPreview({ wbs }: { wbs?: WBSNode }) {
  if (!wbs || wbs.children.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCode className="size-4 text-amber-600" />
            ساختار شکست کار (WBS)
          </CardTitle>
          <CardDescription className="text-xs">
            درختی از کدهای آیتم‌های برگه مالی
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            هنوز آیتمی در برگه مالی ثبت نشده است.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCode className="size-4 text-amber-600" />
          ساختار شکست کار (WBS)
        </CardTitle>
        <CardDescription className="text-xs">
          درختی از کدهای آیتم‌های برگه مالی — مجموع مبالغ هر گروه
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border bg-muted/10 p-2">
          <WbsTree node={wbs} depth={0} />
        </div>
      </CardContent>
    </Card>
  );
}

function WbsTree({ node, depth }: { node: WBSNode; depth: number }) {
  const [open, setOpen] = React.useState(depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 rounded px-1 py-1 hover:bg-muted/30"
        style={{ paddingRight: `${depth * 14 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex size-4 items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={open ? "جمع کردن" : "باز کردن"}
          >
            {open ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronLeft className="size-3.5" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        {node.code ? (
          <Badge variant="outline" className="font-mono text-[10px]">
            {toFa(node.code)}
          </Badge>
        ) : null}
        <span className="truncate text-xs font-medium">{node.title}</span>
        <span className="mr-auto text-[10px] text-muted-foreground tabular-nums">
          {faMoney(node.amount)}
        </span>
      </div>
      {hasChildren && open ? (
        <div>
          {node.children.map((c, i) => (
            <WbsTree key={`${c.code}-${i}`} node={c} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Letterhead Preview ──────────────────────────────────────────────
function LetterheadPreview({
  tenantName,
  signatures,
}: {
  tenantName: string;
  signatures: string;
}) {
  const sigList = React.useMemo<Array<{ role: string; name: string }>>(() => {
    try {
      const p = JSON.parse(signatures || "[]");
      if (Array.isArray(p) && p.length > 0) return p;
    } catch {
      /* ignore */
    }
    return [
      { role: "ناظر", name: "—" },
      { role: "مدیر پروژه", name: "—" },
      { role: "پیمانکار", name: "—" },
    ];
  }, [signatures]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="size-4 text-amber-600" />
          سربرگ و امضاها
        </CardTitle>
        <CardDescription className="text-xs">
          پیش‌نمایش سربرگ سازمان و جایگاه امضاهای ناظر، مدیر و پیمانکار
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border-2 border-amber-200 bg-white p-4 dark:border-amber-800/40 dark:bg-amber-950/10">
          {/* Letterhead header */}
          <div className="flex items-center justify-between gap-3 border-b-2 border-amber-300 pb-3 dark:border-amber-700/40">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <Building2 className="size-6" />
              </div>
              <div>
                <div className="text-base font-bold">{tenantName}</div>
                <div className="text-[10px] text-muted-foreground">
                  جایگاه لوگو / سربرگ سازمان
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              پیش‌نمایش
            </Badge>
          </div>

          {/* Title */}
          <div className="my-4 text-center">
            <div className="text-sm font-semibold">برگه مالی / صورت‌وضعیت</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              شماره: ………… — تاریخ: …………
            </div>
          </div>

          {/* Body placeholder */}
          <div className="space-y-1.5">
            {[100, 95, 92, 88, 96, 90].map((w, i) => (
              <div
                key={i}
                className="h-2 rounded bg-muted/60 dark:bg-muted/40"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>

          {/* Signatures */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-amber-200 pt-4 dark:border-amber-800/40">
            {sigList.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-1 flex size-9 items-center justify-center rounded-full border-2 border-dashed border-amber-300 text-amber-500 dark:border-amber-700/60">
                  <PenLine className="size-4" />
                </div>
                <div className="text-[11px] font-medium">{s.role}</div>
                <div className="text-[10px] text-muted-foreground">
                  نام: {s.name || "………"}
                </div>
                <div className="mt-1 border-b border-dashed border-muted-foreground/30 pb-0.5 text-[9px] text-muted-foreground">
                  امضا و مهر
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  Download helpers (client-side)
// ═════════════════════════════════════════════════════════════════════

async function fetchReport(
  projectId: string,
  apiType: "financial" | "payment" | "wbs",
): Promise<ReportResponse> {
  const r = await fetch(`/api/reports/project/${projectId}?type=${apiType}`);
  if (!r.ok) throw new Error("بارگذاری داده‌ی گزارش ناموفق بود");
  return r.json();
}

// ─── WBS → XML ───────────────────────────────────────────────────────
async function downloadWBS(projectId: string, report: ReportCardDef) {
  const data = await fetchReport(projectId, "wbs");
  if (!data.wbs) throw new Error("داده‌ی WBS موجود نیست");

  const xml = buildWbsXml(data.project, data.wbs);
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  triggerBlobDownload(blob, `wbs-${data.project.code || projectId}.xml`);
}

function buildWbsXml(project: ReportProject, root: WBSNode): string {
  const esc = (s: string) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
  lines.push('<Project xmlns="http://schemas.microsoft.com/project">');
  lines.push(`  <Name>${esc(project.name)}</Name>`);
  lines.push(`  <Code>${esc(project.code)}</Code>`);
  lines.push("  <Tasks>");
  let taskId = 0;
  const nextId = () => ++taskId;

  function walk(node: WBSNode, parent: number | null, depth: number) {
    const id = nextId();
    lines.push(`    <Task>`);
    lines.push(`      <UID>${id}</UID>`);
    lines.push(`      <ID>${id}</ID>`);
    lines.push(`      <Name>${esc(node.title || node.code)}</Name>`);
    lines.push(`      <OutlineLevel>${depth}</OutlineLevel>`);
    lines.push(`      <OutlineNumber>${node.code || String(id)}</OutlineNumber>`);
    lines.push(`      <Cost>${Math.round(node.amount)}</Cost>`);
    if (parent !== null) lines.push(`      <ParentUID>${parent}</ParentUID>`);
    lines.push(`    </Task>`);
    for (const c of node.children) walk(c, id, depth + 1);
  }

  walk(root, null, 0);
  lines.push("  </Tasks>");
  lines.push("</Project>");
  return lines.join("\n");
}

// ─── BOQ → Excel with formulas (exceljs) ─────────────────────────────
async function downloadBoqExcel(projectId: string, _report: ReportCardDef) {
  const data = await fetchReport(projectId, "financial");
  const items = data.project.financialSheet;
  if (items.length === 0) throw new Error("آیتمی در برگه مالی موجود نیست");

  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "سیوان تدبیر تجارت";
  wb.created = new Date();

  // ─── Sheet 1: برگه مالی با فرمول‌ها ───
  const ws = wb.addWorksheet("برگه مالی", {
    views: [{ rightToLeft: true, showGridLines: false }],
    properties: { defaultRowHeight: 20 },
  });

  // سربرگ
  ws.mergeCells("A1:G1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "سیوان تدبیر تجارت — برگه مالی پروژه";
  titleCell.font = { name: "B Nazanin", size: 16, bold: true, color: { argb: "FFB45309" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 32;

  ws.mergeCells("A2:G2");
  const subCell = ws.getCell("A2");
  subCell.value = `پروژه: ${data.project.name} — کد: ${data.project.code}`;
  subCell.font = { name: "B Nazanin", size: 12, italic: true };
  subCell.alignment = { horizontal: "center" };

  // هدر جدول (ردیف ۴)
  const headers = ["کد", "شرح", "واحد", "مقدار", "قیمت واحد", "مبلغ کل", "فصل"];
  const headerRow = ws.getRow(4);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: "B Nazanin", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB45309" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = thinBorder();
  });
  ws.getRow(4).height = 26;

  // ستون‌ها
  ws.columns = [
    { width: 16, key: "code" },
    { width: 42, key: "description" },
    { width: 10, key: "unit" },
    { width: 14, key: "quantity" },
    { width: 18, key: "unitPrice" },
    { width: 20, key: "totalAmount" },
    { width: 8, key: "chapterNo" },
  ];

  // ردیف‌های داده
  const startRow = 5;
  items.forEach((it, idx) => {
    const row = ws.getRow(startRow + idx);
    row.getCell(1).value = it.code;
    row.getCell(2).value = it.description;
    row.getCell(3).value = it.unit;
    row.getCell(4).value = it.quantity;
    row.getCell(5).value = it.unitPrice;
    // فرمول: مبلغ کل = مقدار × قیمت واحد
    row.getCell(6).value = {
      formula: `D${startRow + idx}*E${startRow + idx}`,
    };
    row.getCell(7).value = it.chapterNo;

    // استایل‌گذاری
    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "B Nazanin", size: 10 };
      cell.border = thinBorder();
      if (c === 4 || c === 5 || c === 6) {
        cell.alignment = { horizontal: "left" };
        cell.numFmt = "#,##0";
      } else {
        cell.alignment = { horizontal: "center" };
      }
    }
    // رنگ متناوب
    if (idx % 2 === 1) {
      for (let c = 1; c <= 7; c++) {
        row.getCell(c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFF7ED" },
        };
      }
    }
  });

  // ردیف جمع کل (با فرمول)
  const totalRow = startRow + items.length;
  ws.getCell(`A${totalRow}`).value = "جمع کل";
  ws.mergeCells(`A${totalRow}:E${totalRow}`);
  const totalLabel = ws.getCell(`A${totalRow}`);
  totalLabel.font = { name: "B Nazanin", size: 12, bold: true };
  totalLabel.alignment = { horizontal: "center", vertical: "middle" };
  totalLabel.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFED7AA" },
  };
  // فرمول جمع: SUM از اولین تا آخرین ردیف مبلغ کل
  ws.getCell(`F${totalRow}`).value = {
    formula: `SUM(F${startRow}:F${startRow + items.length - 1})`,
  };
  ws.getCell(`F${totalRow}`).font = { name: "B Nazanin", size: 12, bold: true };
  ws.getCell(`F${totalRow}`).numFmt = "#,##0";
  ws.getCell(`F${totalRow}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFED7AA" },
  };
  ws.getCell(`G${totalRow}`).value = "";
  ws.getCell(`G${totalRow}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFED7AA" },
  };
  ws.getRow(totalRow).height = 28;

  // ─── Sheet 2: خلاصه فصول ───
  const ws2 = wb.addWorksheet("خلاصه فصول", {
    views: [{ rightToLeft: true }],
  });
  ws2.addRow(["فصل", "عنوان", "مبلغ", "درصد"]);
  const chapters = (data.project.chapters || []) as any[];
  const chStartRow = 2;
  chapters.forEach((ch, idx) => {
    const r = chStartRow + idx;
    ws2.addRow([ch.chapterNo, ch.title, ch.amount, null]);
    // فرمول درصد: مبلغ فصل / جمع کل
    ws2.getCell(`D${r}`).value = {
      formula: `C${r}/SUM(C${chStartRow}:C${chStartRow + chapters.length - 1})`,
    };
    ws2.getCell(`D${r}`).numFmt = "0.00%";
  });

  // استایل هدر فصول
  const chHeader = ws2.getRow(1);
  chHeader.eachCell((cell) => {
    cell.font = { name: "B Nazanin", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB45309" },
    };
    cell.alignment = { horizontal: "center" };
  });
  ws2.columns = [
    { width: 10 },
    { width: 30 },
    { width: 18 },
    { width: 12 },
  ];

  // خروجی
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerBlobDownload(blob, `boq-${data.project.code || projectId}.xlsx`);
}

function thinBorder() {
  const b = { style: "thin" as const, color: { argb: "FFE5E7EB" } };
  return { top: b, bottom: b, left: b, right: b };
}

// ─── Print Report (PDF via browser) ──────────────────────────────────
async function printReport(
  projectId: string,
  report: ReportCardDef,
  tenantName: string,
) {
  const apiType = report.apiType || "financial";
  const data = await fetchReport(projectId, apiType);
  const html = buildReportHtml(report, data.project, tenantName);

  const w = window.open("", "_blank");
  if (!w) {
    throw new Error("باز شدن پنجره‌ی چاپ مسدود شد. لطفاً popup را اجازه دهید.");
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  // give the browser a tick to render before printing
  setTimeout(() => {
    try {
      w.focus();
      w.print();
    } catch {
      /* ignore */
    }
  }, 500);
}

function buildReportHtml(
  report: ReportCardDef,
  project: ReportProject,
  tenantName: string,
): string {
  const today = new Date().toLocaleDateString("fa-IR");
  const title = report.title;

  let body = "";
  if (report.type === "financial" || report.type === "boq" || report.type === "chapters") {
    body = renderFinancialBody(project, report.type === "chapters");
  } else if (report.type === "payment" || report.type === "adjustment") {
    body = renderPaymentBody(project, report.type === "adjustment");
  }

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)} — ${escapeHtml(project.name)}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: Vazirmatn, Tahoma, sans-serif; color: #1f2937; font-size: 11pt; }
  .letterhead { display: flex; justify-content: space-between; align-items: center;
    border-bottom: 3px solid #d97706; padding-bottom: 10px; margin-bottom: 18px; }
  .letterhead .org { display: flex; align-items: center; gap: 12px; }
  .letterhead .logo { width: 48px; height: 48px; background: #fef3c7;
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    color: #b45309; font-weight: bold; }
  .letterhead .name { font-weight: bold; font-size: 14pt; }
  .letterhead .sub { color: #6b7280; font-size: 9pt; }
  .doc-title { text-align: center; margin: 16px 0 10px; }
  .doc-title h2 { font-size: 14pt; margin: 0; }
  .doc-title .meta { color: #6b7280; font-size: 9pt; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 9.5pt; }
  th, td { border: 1px solid #d1d5db; padding: 4px 6px; text-align: right; }
  th { background: #fef3c7; color: #92400e; font-weight: 600; }
  td.num { text-align: left; font-feature-settings: "tnum"; }
  tr:nth-child(even) td { background: #fafaf9; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0; }
  .summary .cell { border: 1px solid #e5e7eb; padding: 8px; border-radius: 6px; }
  .summary .label { font-size: 8.5pt; color: #6b7280; }
  .summary .value { font-weight: bold; font-size: 12pt; margin-top: 2px; }
  .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
    margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  .sig { text-align: center; }
  .sig .role { font-size: 9.5pt; font-weight: 600; }
  .sig .line { border-bottom: 1px dashed #9ca3af; margin: 24px 4px 4px; }
  .sig .hint { font-size: 8pt; color: #6b7280; }
  .footer { margin-top: 20px; text-align: center; font-size: 8.5pt; color: #9ca3af;
    border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style>
</head>
<body>
  <div class="letterhead">
    <div class="org">
      <div class="logo">logo</div>
      <div>
        <div class="name">${escapeHtml(tenantName)}</div>
        <div class="sub">پلتفرم متره و برآورد</div>
      </div>
    </div>
    <div class="sub">تاریخ: ${today}</div>
  </div>

  <div class="doc-title">
    <h2>${escapeHtml(title)}</h2>
    <div class="meta">
      پروژه: ${escapeHtml(project.name)} — کد: ${escapeHtml(project.code)} —
      سال: ${toFa(project.year)}
      ${project.location ? `— موقعیت: ${escapeHtml(project.location)}` : ""}
    </div>
  </div>

  ${body}

  <div class="signatures">
    <div class="sig">
      <div class="role">ناظر</div>
      <div class="line"></div>
      <div class="hint">نام و امضا</div>
    </div>
    <div class="sig">
      <div class="role">مدیر پروژه</div>
      <div class="line"></div>
      <div class="hint">نام و امضا</div>
    </div>
    <div class="sig">
      <div class="role">پیمانکار</div>
      <div class="line"></div>
      <div class="hint">نام و امضا</div>
    </div>
  </div>

  <div class="footer">
    این خروجی توسط پلتفرم متره و برآورد تولید شده است — ${today}
  </div>
</body>
</html>`;
}

function renderFinancialBody(project: ReportProject, chaptersOnly: boolean): string {
  if (chaptersOnly) {
    const chapters = project.chapters;
    const total = chapters.reduce((s, c) => s + c.amount, 0);
    return `
      <div class="summary">
        <div class="cell"><div class="label">مبلغ پیمان</div><div class="value">${faMoney(project.contractAmount)}</div></div>
        <div class="cell"><div class="label">مجموع فصول</div><div class="value">${faMoney(total)}</div></div>
        <div class="cell"><div class="label">تعداد فصول</div><div class="value">${toFa(chapters.length)}</div></div>
      </div>
      <table>
        <thead><tr><th>فصل</th><th>عنوان</th><th class="num">مبلغ</th><th class="num">درصد</th></tr></thead>
        <tbody>
          ${chapters
            .map(
              (c) =>
                `<tr><td>${toFa(c.chapterNo)}</td><td>${escapeHtml(c.title)}</td><td class="num">${faRial(c.amount)}</td><td class="num">${faPct(c.percent)}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>`;
  }

  const items = project.financialSheet;
  const total = items.reduce((s, i) => s + i.totalAmount, 0);
  return `
    <div class="summary">
      <div class="cell"><div class="label">تعداد آیتم</div><div class="value">${toFa(items.length)}</div></div>
      <div class="cell"><div class="label">مبلغ پیمان</div><div class="value">${faMoney(project.contractAmount)}</div></div>
      <div class="cell"><div class="label">مجموع برگه مالی</div><div class="value">${faMoney(total)}</div></div>
    </div>
    <table>
      <thead>
        <tr><th>کد</th><th>شرح</th><th>واحد</th><th class="num">مقدار</th><th class="num">قیمت واحد</th><th class="num">مبلغ کل</th><th>فصل</th></tr>
      </thead>
      <tbody>
        ${items
          .map(
            (it) =>
              `<tr><td>${escapeHtml(it.code)}</td><td>${escapeHtml(it.description)}</td><td>${escapeHtml(it.unit)}</td><td class="num">${faNum(it.quantity, 2)}</td><td class="num">${faNum(it.unitPrice)}</td><td class="num">${faRial(it.totalAmount)}</td><td>${toFa(it.chapterNo)}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>`;
}

function renderPaymentBody(project: ReportProject, adjustmentOnly: boolean): string {
  const payments = project.payments;
  if (payments.length === 0) {
    return `<div style="text-align:center;padding:24px;color:#9ca3af;">صورت‌وضعیتی ثبت نشده است.</div>`;
  }

  if (adjustmentOnly) {
    const rows: string[] = [];
    for (const p of payments) {
      for (const it of p.items) {
        if (!it.isAdjusted) continue;
        rows.push(
          `<tr><td>${escapeHtml(it.code)}</td><td>${escapeHtml(it.description)}</td><td class="num">${faRial(it.executedAmount)}</td><td class="num">${faRial(it.adjustedAmount)}</td><td class="num">${faRial(it.adjustedAmount - it.executedAmount)}</td></tr>`,
        );
      }
    }
    return `
      <table>
        <thead>
          <tr><th>کد</th><th>شرح</th><th class="num">مبلغ اجرا</th><th class="num">مبلغ تعدیل‌شده</th><th class="num">مابه‌التفاوت</th></tr>
        </thead>
        <tbody>${rows.join("") || `<tr><td colspan="5" style="text-align:center;color:#9ca3af;">ردیف تعدیل‌شده‌ای موجود نیست.</td></tr>`}</tbody>
      </table>`;
  }

  return payments
    .map(
      (p) => `
      <h3 style="margin:14px 0 6px;font-size:11pt;">دوره‌ی ${toFa(p.periodNo)} — وضعیت: ${escapeHtml(p.status)}</h3>
      <div class="summary">
        <div class="cell"><div class="label">مبلغ اجرا</div><div class="value">${faMoney(p.executedAmount)}</div></div>
        <div class="cell"><div class="label">کسورات</div><div class="value">${faMoney(p.guarantee + p.insurance + p.tax)}</div></div>
        <div class="cell"><div class="label">خالص پرداختنی</div><div class="value">${faMoney(p.netPayable)}</div></div>
      </div>
      <table>
        <thead>
          <tr><th>کد</th><th>شرح</th><th class="num">مقدار کل</th><th class="num">مقدار اجرا</th><th class="num">مبلغ اجرا</th><th class="num">تعدیل‌شده</th></tr>
        </thead>
        <tbody>
          ${p.items
            .map(
              (it) =>
                `<tr><td>${escapeHtml(it.code)}</td><td>${escapeHtml(it.description)}</td><td class="num">${faNum(it.totalQuantity, 2)}</td><td class="num">${faNum(it.executedQuantity, 2)}</td><td class="num">${faRial(it.executedAmount)}</td><td class="num">${faRial(it.adjustedAmount || it.executedAmount)}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>`,
    )
    .join("");
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Skeleton ────────────────────────────────────────────────────────
function ReportsSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────
function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export default ReportsView;
