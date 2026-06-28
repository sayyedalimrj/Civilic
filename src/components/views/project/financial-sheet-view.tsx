"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Calculator,
  Star,
  RefreshCw,
  Loader2,
  TrendingDown,
  Info,
  Hash,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAppStore } from "@/lib/store";
import { faNum, faMoney, faRial, toFa } from "@/lib/fa";
import { descendingPriceAdjustment } from "@/lib/calc/cascade";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CommentThread } from "@/components/comments/comment-thread";

// ─── Types ───────────────────────────────────────────────────────────
interface AnalysisResult {
  labor: number;
  equipment: number;
  material: number;
  transport: number;
  total: number;
}

interface FinancialSheetItem {
  id: string;
  projectId: string;
  summaryBoqId: string | null;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  isStarred: boolean;
  relatedCode: string | null;
  reference: string; // NET | STATS | DAILY
  totalAmount: number;
  analysis: string; // JSON string
  chapterNo: number;
  updatedAt: string;
}

interface CascadeResult {
  summaryBoqUpdated: number;
  financialSheetTotal: number;
  chaptersUpdated: number;
}

interface ProjectResponse {
  project: {
    id: string;
    name: string;
    code: string;
    cachedTotal: number;
    financialSheet: FinancialSheetItem[];
  };
}

// ─── Constants ───────────────────────────────────────────────────────
const REFERENCES: { value: string; label: string; color: string }[] = [
  { value: "NET", label: "خالص", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
  { value: "STATS", label: "آمار", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
  { value: "DAILY", label: "روزانه", color: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300" },
];

const CHAPTERS = Array.from({ length: 7 }, (_, i) => i + 1);

const CHAPTER_TITLES: Record<number, string> = {
  1: "اول — عملیات زمینی",
  2: "دوم — اسکلت و سازه",
  3: "سوم — دیوارچینی",
  4: "چهارم — نازک‌کاری",
  5: "پنجم — تأسیسات",
  6: "ششم — در و پنجره",
  7: "هفتم — متفرقه",
};

function parseAnalysis(raw: string): AnalysisResult {
  try {
    const p = JSON.parse(raw || "{}");
    return {
      labor: Number(p.labor) || 0,
      equipment: Number(p.equipment) || 0,
      material: Number(p.material) || 0,
      transport: Number(p.transport) || 0,
      total: Number(p.total) || 0,
    };
  } catch {
    return { labor: 0, equipment: 0, material: 0, transport: 0, total: 0 };
  }
}

function parseFaNumber(input: string): number {
  const en = input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,،\s]/g, "");
  const n = parseFloat(en);
  return isFinite(n) ? n : 0;
}

// ─── Analysis Dialog (۴ عامل) ───────────────────────────────────────
function AnalysisDialog({ item }: { item: FinancialSheetItem }) {
  const [open, setOpen] = React.useState(false);
  const analysis = React.useMemo(() => parseAnalysis(item.analysis), [item.analysis]);

  const chartData = [
    { name: "نیروی انسانی", value: analysis.labor, fill: "#d97706" },
    { name: "ماشین‌آلات", value: analysis.equipment, fill: "#65a30d" },
    { name: "مصالح", value: analysis.material, fill: "#475569" },
    { name: "حمل", value: analysis.transport, fill: "#dc2626" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() => setOpen(true)}
      >
        <BarChart3 className="size-4" />
        آنالیز بها
      </Button>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-amber-600" />
            آنالیز بهای ۴ عامل
          </DialogTitle>
          <DialogDescription>
            <Badge variant="outline" className="font-mono text-[11px]">{item.code}</Badge>
            <span className="mr-2">{item.description}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Mini bar chart */}
        <div className="rounded-lg border bg-muted/20 p-3">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} reversed />
              <YAxis
                tickFormatter={(v) => faMoney(v)}
                tick={{ fontSize: 10 }}
                width={80}
                orientation="right"
              />
              <Tooltip
                formatter={(v: number) => faRial(v)}
                contentStyle={{ fontFamily: "inherit", fontSize: 12, borderRadius: 8 }}
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((c, i) => (
                  <Cell key={i} fill={c.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4-factor breakdown */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <FactorCard label="نیروی انسانی" value={analysis.labor} pct={analysis.total ? (analysis.labor / analysis.total) * 100 : 0} color="bg-amber-500" />
          <FactorCard label="ماشین‌آلات" value={analysis.equipment} pct={analysis.total ? (analysis.equipment / analysis.total) * 100 : 0} color="bg-lime-600" />
          <FactorCard label="مصالح" value={analysis.material} pct={analysis.total ? (analysis.material / analysis.total) * 100 : 0} color="bg-slate-600" />
          <FactorCard label="حمل" value={analysis.transport} pct={analysis.total ? (analysis.transport / analysis.total) * 100 : 0} color="bg-rose-600" />
        </div>

        <Separator />

        <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2.5 dark:bg-amber-950/30">
          <span className="text-sm font-medium text-amber-900 dark:text-amber-200">مبلغ کل (پس از ضریب)</span>
          <span className="text-lg font-bold tabular-nums text-amber-900 dark:text-amber-200">
            {faRial(analysis.total)}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FactorCard({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <span className={cn("size-2 rounded-full", color)} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-sm font-semibold tabular-nums">{faRial(value)}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{toFa(pct.toFixed(1))}٪</div>
    </div>
  );
}

// ─── Descending Price Dialog (بخشنامه ۴۹۵۱) ─────────────────────────
function DescendingPriceDialog({ item }: { item: FinancialSheetItem }) {
  const [open, setOpen] = React.useState(false);
  const [threshold, setThreshold] = React.useState("0.8");

  const result = React.useMemo(() => {
    const t = parseFaNumber(threshold);
    return descendingPriceAdjustment(item.totalAmount, t > 0 && t <= 1 ? t : 0.8);
  }, [item.totalAmount, threshold]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() => setOpen(true)}
      >
        <TrendingDown className="size-4" />
        نزولی بها
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="size-5 text-amber-600" />
            نزولی بها (بخشنامه ۴۹۵۱)
          </DialogTitle>
          <DialogDescription>
            محاسبه‌ی مبلغ نهایی پس از اعمال کسور نزولی بر اساس آستانه‌ی تعیین‌شده.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">آستانه‌ی نزولی (۰ تا ۱)</label>
          <Input
            type="text"
            inputMode="decimal"
            dir="ltr"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="h-9 text-left tabular-nums"
          />
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
          <Row label="مبلغ پایه" value={faRial(item.totalAmount)} />
          <Row
            label={`کسر نزولی (${toFa((parseFaNumber(threshold) * 100).toFixed(0))}٪)`}
            value={`− ${faRial(result.adjustment)}`}
            color="text-rose-600"
          />
          <Separator />
          <Row label="مبلغ نهایی" value={faRial(result.finalAmount)} bold />
        </div>

        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30">
          <Info className="size-4" />
          <AlertTitle className="text-xs">یادداشت</AlertTitle>
          <AlertDescription className="text-[11px]">
            فرمول: مبلغ‌نهایی = مبلغ‌پایه × آستانه. در صورت نزولی شدن بهای تمام‌شده، مابه‌التفاوت از صورت‌وضعیت کسر می‌شود.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-xs text-muted-foreground", bold && "text-sm font-medium text-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          bold ? "text-base font-bold" : "text-sm font-medium",
          color,
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Inline Unit Price Editor (Optimistic) ──────────────────────────
function UnitPriceCell({
  item,
  onCommit,
}: {
  item: FinancialSheetItem;
  onCommit: (itemId: string, unitPrice: number) => void;
}) {
  const [value, setValue] = React.useState(toFa(item.unitPrice.toString()));
  const [editing, setEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!editing) setValue(toFa(item.unitPrice.toString()));
  }, [item.unitPrice, editing]);

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const n = parseFaNumber(value);
    setEditing(false);
    if (n !== item.unitPrice) {
      onCommit(item.id, n);
    } else {
      setValue(toFa(item.unitPrice.toString()));
    }
  };

  if (!item.isStarred) {
    // Read-only — only starred items allow editing
    return (
      <span className="tabular-nums text-sm text-muted-foreground" title="فقط آیتم‌های ستاره‌دار قابل ویرایش">
        {faNum(item.unitPrice)}
      </span>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-left tabular-nums text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
        title="برای ویرایش کلیک کنید"
      >
        {faNum(item.unitPrice)}
      </button>
    );
  }

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      dir="ltr"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setValue(toFa(item.unitPrice.toString()));
          setEditing(false);
        }
      }}
      className="h-9 w-32 text-left tabular-nums"
    />
  );
}

// ─── Reference Toggle (Badge-based) ─────────────────────────────────
function ReferenceToggle({
  item,
  onCommit,
}: {
  item: FinancialSheetItem;
  onCommit: (itemId: string, reference: string) => void;
}) {
  const current = REFERENCES.find((r) => r.value === item.reference) || REFERENCES[0];
  const cycle = () => {
    const idx = REFERENCES.findIndex((r) => r.value === item.reference);
    const next = REFERENCES[(idx + 1) % REFERENCES.length];
    onCommit(item.id, next.value);
  };
  return (
    <button
      type="button"
      onClick={cycle}
      title="مرجع قیمت — برای تغییر کلیک کنید"
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-transform hover:scale-105",
        current.color,
      )}
    >
      {current.label}
    </button>
  );
}

// ─── Chapter Selector ───────────────────────────────────────────────
function ChapterSelector({
  item,
  onCommit,
}: {
  item: FinancialSheetItem;
  onCommit: (itemId: string, chapterNo: number) => void;
}) {
  return (
    <Select
      value={String(item.chapterNo)}
      onValueChange={(v) => onCommit(item.id, Number(v))}
    >
      <SelectTrigger size="sm" className="h-8 w-20 gap-1 text-[11px]">
        <Hash className="size-3 opacity-50" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CHAPTERS.map((c) => (
          <SelectItem key={c} value={String(c)} className="text-xs">
            <span className="font-mono">{toFa(c)}</span>
            <span className="mr-1 text-muted-foreground">— {CHAPTER_TITLES[c]}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Main View ───────────────────────────────────────────────────────
export function FinancialSheetView() {
  const projectId = useAppStore((s) => s.selectedProjectId);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ProjectResponse>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}`);
      if (!r.ok) throw new Error("بارگذاری پروژه ناموفق بود");
      return r.json();
    },
    enabled: !!projectId,
  });

  const items = data?.project?.financialSheet ?? [];
  const total = items.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const starredCount = items.filter((i) => i.isStarred).length;

  // ─── Optimistic mutation for unit price + star toggle + ref + chapter ───
  const updateMutation = useMutation({
    mutationFn: async (payload: {
      itemId: string;
      unitPrice?: number;
      isStarred?: boolean;
      reference?: string;
      chapterNo?: number;
      relatedCode?: string;
    }) => {
      const r = await fetch(`/api/projects/${projectId}/financial-sheet`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<{ item: FinancialSheetItem; cascade: CascadeResult }>;
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ["project", projectId] });
      const prev = qc.getQueryData<ProjectResponse>(["project", projectId]);
      if (prev && payload.unitPrice !== undefined) {
        // Optimistic: update unitPrice + recompute totalAmount locally
        const newItems = prev.project.financialSheet.map((it) =>
          it.id === payload.itemId
            ? { ...it, unitPrice: payload.unitPrice!, totalAmount: it.quantity * payload.unitPrice! }
            : it,
        );
        qc.setQueryData<ProjectResponse>(["project", projectId], {
          ...prev,
          project: { ...prev.project, financialSheet: newItems },
        });
      }
      return { prev };
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["project", projectId], ctx.prev);
      }
      toast({
        variant: "destructive",
        title: "خطا در به‌روزرسانی",
        description: err.message,
      });
    },
    onSettled: (data) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      if (data?.cascade) {
        toast({
          title: "به‌روزرسانی شد",
          description: (
            <span className="text-xs leading-5">
              مبلغ کل برگه مالی: <b>{faMoney(data.cascade.financialSheetTotal)}</b> — فصول:{" "}
              <b>{toFa(data.cascade.chaptersUpdated)}</b>
            </span>
          ),
        });
      }
    },
  });

  // ─── Empty / loading / error states ───
  if (!projectId) {
    return (
      <EmptyState
        icon={<Calculator className="size-8" />}
        title="پروژه‌ای انتخاب نشده"
        description="یک پروژه را از نوار کناری انتخاب کنید تا برگه مالی آن نمایش داده شود."
      />
    );
  }

  if (isLoading) {
    return <FinancialSheetSkeleton />;
  }

  if (isError) {
    return (
      <EmptyState
        icon={<RefreshCw className="size-8" />}
        title="خطا در بارگذاری"
        description="بارگذاری پروژه ناموفق بود."
        action={
          <Button variant="outline" className="h-9" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            تلاش مجدد
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Calculator className="size-5 text-amber-600" />
            برگه مالی
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            پروژه: <span className="font-medium text-foreground">{data?.project.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="h-9 gap-1.5 px-3"
            title="آیتم‌های ستاره‌دار با قیمت اختصاصی"
          >
            <Star className="size-3.5 fill-amber-500 text-amber-500" />
            {toFa(starredCount)} ستاره‌دار
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            بازخوانی
          </Button>
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Calculator className="size-8" />}
          title="برگه مالی خالی است"
          description="ابتدا در تب «ریزمتره» ردیف‌هایی اضافه کنید. پس از آن، برگه مالی به‌صورت خودکار از تجمیع ریزمتره ساخته می‌شود."
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-y-auto">
              <Table className="boq-table">
                <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="h-10 w-12 bg-muted/60 px-2 text-center font-medium">#</TableHead>
                    <TableHead className="h-10 bg-muted/60 px-2 font-medium">کد</TableHead>
                    <TableHead className="h-10 bg-muted/60 px-2 font-medium">شرح</TableHead>
                    <TableHead className="h-10 w-20 bg-muted/60 px-2 font-medium">واحد</TableHead>
                    <TableHead className="h-10 w-24 bg-muted/60 px-2 text-left font-medium">مقدار</TableHead>
                    <TableHead className="h-10 w-32 bg-muted/60 px-2 text-left font-medium">قیمت واحد</TableHead>
                    <TableHead className="h-10 w-36 bg-muted/60 px-2 text-left font-medium">مبلغ کل</TableHead>
                    <TableHead className="h-10 w-24 bg-muted/60 px-2 text-center font-medium">فصل</TableHead>
                    <TableHead className="h-10 w-20 bg-muted/60 px-2 text-center font-medium">مرجع</TableHead>
                    <TableHead className="h-10 w-12 bg-muted/60 px-2 text-center font-medium">ستاره</TableHead>
                    <TableHead className="h-10 w-52 bg-muted/60 px-2 text-center font-medium">ابزار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="px-2 text-center text-xs text-muted-foreground">
                        {toFa(idx + 1)}
                      </TableCell>
                      <TableCell className="px-2">
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {item.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[28vw] px-2">
                        <div className="truncate text-sm" title={item.description}>
                          {item.description}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 text-xs text-muted-foreground">{item.unit}</TableCell>
                      <TableCell className="px-2 text-left text-sm tabular-nums">
                        {faNum(item.quantity, 2)}
                      </TableCell>
                      <TableCell className="px-2 text-left">
                        <UnitPriceCell
                          item={item}
                          onCommit={(itemId, unitPrice) =>
                            updateMutation.mutate({ itemId, unitPrice })
                          }
                        />
                        {updateMutation.isPending && updateMutation.variables?.itemId === item.id && (
                          <Loader2 className="mt-1 inline size-3 animate-spin text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell className="px-2 text-left text-sm font-semibold tabular-nums">
                        {faRial(item.totalAmount)}
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        <ChapterSelector
                          item={item}
                          onCommit={(itemId, chapterNo) =>
                            updateMutation.mutate({ itemId, chapterNo })
                          }
                        />
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        <ReferenceToggle
                          item={item}
                          onCommit={(itemId, reference) =>
                            updateMutation.mutate({ itemId, reference })
                          }
                        />
                      </TableCell>
                      <TableCell className="px-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "size-9",
                            item.isStarred
                              ? "text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                          aria-label={item.isStarred ? "حذف ستاره" : "ستاره‌دار کردن"}
                          onClick={() =>
                            updateMutation.mutate({ itemId: item.id, isStarred: !item.isStarred })
                          }
                        >
                          <Star className={cn("size-4", item.isStarred && "fill-amber-500")} />
                        </Button>
                      </TableCell>
                      <TableCell className="px-2">
                        <div className="flex items-center justify-center gap-1">
                          <AnalysisDialog item={item} />
                          <DescendingPriceDialog item={item} />
                          <CommentThread
                            projectId={projectId as string}
                            entityType="FINANCIAL_SHEET"
                            entityId={item.id}
                            entityLabel={`برگه مالی — کد ${item.code}${item.description ? ` (${item.description.slice(0, 40)})` : ""}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Sticky total footer */}
            <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t bg-gradient-to-l from-amber-50 to-orange-50 px-4 py-3 dark:from-amber-950/40 dark:to-orange-950/30">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <Calculator className="size-4" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">مبلغ کل برگه مالی</div>
                  <div className="text-[10px] text-muted-foreground">
                    {toFa(items.length)} ردیف — {toFa(starredCount)} ستاره‌دار
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="text-xl font-bold tabular-nums text-amber-900 dark:text-amber-200">
                  {faMoney(total)}
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  {faRial(total)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────
function FinancialSheetSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[70vh] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {Array.from({ length: 11 }).map((_, i) => (
                    <TableHead key={i} className="bg-muted/40">
                      <Skeleton className="h-4 w-12" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, r) => (
                  <TableRow key={r}>
                    {Array.from({ length: 11 }).map((_, c) => (
                      <TableCell key={c}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
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

export default FinancialSheetView;
