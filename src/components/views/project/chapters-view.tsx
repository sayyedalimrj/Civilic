"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  RefreshCw,
  Info,
  Layers3,
  HardHat,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { useAppStore } from "@/lib/store";
import { faNum, faMoney, faRial, faPct, toFa } from "@/lib/fa";
import { progressColor } from "@/lib/fa";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── Types ───────────────────────────────────────────────────────────
interface Chapter {
  id: string;
  chapterNo: number;
  title: string;
  amount: number;
  isWorkshopSetup: boolean;
  workshopMode: string | null;
  percent: number;
  updatedAt: string;
}

interface ProjectResponse {
  project: {
    id: string;
    name: string;
    code: string;
    contractAmount: number;
    cachedTotal: number;
    chapters: Chapter[];
  };
}

// ─── Constants ───────────────────────────────────────────────────────
const CHAPTER_COLORS = [
  "#d97706", // amber-600
  "#ea580c", // orange-600
  "#65a30d", // lime-600
  "#475569", // slate-600
  "#dc2626", // red-600
  "#0891b2", // cyan-600
  "#7c3aed", // violet-600
  "#0f766e", // teal-700
];

// ─── Main View ───────────────────────────────────────────────────────
export function ChaptersView() {
  const projectId = useAppStore((s) => s.selectedProjectId);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ProjectResponse>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}`);
      if (!r.ok) throw new Error("بارگذاری پروژه ناموفق بود");
      return r.json();
    },
    enabled: !!projectId,
  });

  const chapters = data?.project?.chapters ?? [];
  const total = chapters.reduce((s, c) => s + (c.amount || 0), 0);
  const workshopChapter = chapters.find((c) => c.isWorkshopSetup);

  const chartData = chapters.map((c) => ({
    name: `فصل ${toFa(c.chapterNo)}`,
    title: c.title,
    amount: c.amount,
    fill: CHAPTER_COLORS[(c.chapterNo - 1) % CHAPTER_COLORS.length],
  }));

  const handleRecompute = async () => {
    await qc.invalidateQueries({ queryKey: ["project", projectId] });
    await refetch();
    toast({
      title: "بازمحاسبه شد",
      description: (
        <span className="text-xs leading-5">
          توزیع مبالغ روی {toFa(chapters.length)} فصل از روی برگه مالی بازمحاسبه شد.
        </span>
      ),
    });
  };

  // ─── Empty / loading / error states ───
  if (!projectId) {
    return (
      <EmptyState
        icon={<BookOpen className="size-8" />}
        title="پروژه‌ای انتخاب نشده"
        description="یک پروژه را از نوار کناری انتخاب کنید تا توزیع فصول آن نمایش داده شود."
      />
    );
  }

  if (isLoading) {
    return <ChaptersSkeleton />;
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
            <BookOpen className="size-5 text-amber-600" />
            فصول
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            پروژه: <span className="font-medium text-foreground">{data?.project.name}</span>{" "}
            <span className="font-mono">({toFa(data?.project.code || "")})</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="h-9 gap-1.5 px-3">
            <Layers3 className="size-3.5 text-amber-600" />
            {toFa(chapters.length)} فصل
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleRecompute}
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            بازمحاسبه
          </Button>
        </div>
      </div>

      {/* Summary card with horizontal stacked bar */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-amber-600" />
            توزیع مبالغ روی فصول
          </CardTitle>
          <CardDescription className="text-xs">
            مجموع مبالغ همه‌ی فصول به‌همراه نمودار سهم هر فصل
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] text-muted-foreground">مجموع فصول</div>
              <div className="mt-0.5 text-2xl font-bold tabular-nums text-amber-900 dark:text-amber-200">
                {faMoney(total)}
              </div>
              <div className="text-[10px] text-muted-foreground tabular-nums">
                {faRial(total)}
              </div>
            </div>
            {data?.project.contractAmount ? (
              <div className="text-left">
                <div className="text-[11px] text-muted-foreground">مبلغ پیمان</div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums">
                  {faMoney(data.project.contractAmount)}
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  مابه‌التفاوت:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      total >= data.project.contractAmount
                        ? "text-emerald-600"
                        : "text-amber-600",
                    )}
                  >
                    {faMoney(total - data.project.contractAmount)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Horizontal stacked bar via recharts */}
          {chartData.length > 0 ? (
            <div className="rounded-lg border bg-muted/20 p-3">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 12, bottom: 4 }}
                  barCategoryGap={1}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => faMoney(v)}
                    tick={{ fontSize: 10 }}
                    reversed
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={64}
                    orientation="right"
                  />
                  <Tooltip
                    formatter={(v: number, _n, p) => {
                      const t = (p?.payload as { title?: string })?.title;
                      return [`${faRial(v)}${t ? ` — ${t}` : ""}`, "مبلغ"];
                    }}
                    contentStyle={{ fontFamily: "inherit", fontSize: 12, borderRadius: 8 }}
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 4, 4]}>
                    {chartData.map((c, i) => (
                      <Cell key={i} fill={c.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              هنوز فصلی ثبت نشده است.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chapters grid */}
      {chapters.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-8" />}
          title="فصلی موجود نیست"
          description="فصول به‌صورت خودکار از روی ردیف‌های برگه مالی ساخته می‌شوند. ابتدا در تب «برگه مالی» ردیف‌ها را تعریف و سپس بازمحاسبه کنید."
          action={
            <Button variant="outline" className="h-9" onClick={handleRecompute}>
              <RefreshCw className="size-4" />
              بازمحاسبه
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((c) => (
            <ChapterCard key={c.id} chapter={c} total={total} />
          ))}
        </div>
      )}

      {/* Info section: بخشنامه‌ها */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4 text-amber-600" />
            بخشنامه‌ها و قواعد فصول
          </CardTitle>
          <CardDescription className="text-xs">
            اطلاعات مرجع درباره‌ی قواعد تفکیک فصول و تجهیز کارگاه
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Accordion type="single" collapsible defaultValue="item-76574">
            <AccordionItem value="item-76574" className="rounded-lg border bg-muted/20 px-4 first:border-t">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    بخشنامه ۷۶۵۷۴
                  </Badge>
                  تفکیک مبالغ بر اساس فصول استاندارد
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-6 text-muted-foreground">
                بر اساس این بخشنامه، مبالغ پیمان باید به‌صورت تفکیکی در فصول استاندارد
                (۱ تا ۷) دسته‌بندی شوند: فصل اول (عملیات زمینی)، فصل دوم (اسکلت و سازه)،
                فصل سوم (دیوارچینی)، فصل چهارم (نازک‌کاری)، فصل پنجم (تأسیسات)، فصل ششم
                (در و پنجره) و فصل هفتم (متفرقه). مبالغ هر فصل برابر است با مجموع مبالغ
                ردیف‌های برگه مالی که به آن فصل تخصیص یافته‌اند.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4951" className="mt-2 rounded-lg border bg-muted/20 px-4">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300">
                    بخشنامه ۴۹۵۱
                  </Badge>
                  نزولی بها و تجهیز کارگاه
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs leading-6 text-muted-foreground">
                در صورت پایین بودن بهای تمام‌شده از آستانه‌ی تعیین‌شده، مابه‌التفاوت به‌عنوان
                کسر نزولی از صورت‌وضعیت کسر می‌شود. فصل «تجهیز کارگاه» به‌عنوان فصل مجزا
                با ضریب پیش‌پرداخت شناخته می‌شود و معمولاً در ابتدای پیمان تسویه می‌گردد.
                {workshopChapter ? (
                  <Alert className="mt-2 border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30">
                    <HardHat className="size-4" />
                    <AlertTitle className="text-xs">تجهیز کارگاه فعال</AlertTitle>
                    <AlertDescription className="text-[11px]">
                      فصل {toFa(workshopChapter.chapterNo)} به‌عنوان فصل تجهیز کارگاه{" "}
                      {workshopChapter.workshopMode
                        ? `با حالت «${workshopChapter.workshopMode}» `
                        : ""}
                      علامت‌گذاری شده است.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Chapter Card ────────────────────────────────────────────────────
function ChapterCard({ chapter, total }: { chapter: Chapter; total: number }) {
  const pct = total > 0 ? (chapter.amount / total) * 100 : chapter.percent || 0;
  const color = CHAPTER_COLORS[(chapter.chapterNo - 1) % CHAPTER_COLORS.length];

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {toFa(chapter.chapterNo)}
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">{chapter.title}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                فصل {toFa(chapter.chapterNo)}
              </div>
            </div>
          </div>
          {chapter.isWorkshopSetup && (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <HardHat className="size-3" />
              تجهیز کارگاه
            </Badge>
          )}
        </div>

        <div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-[10px] text-muted-foreground">مبلغ فصل</div>
              <div className="text-lg font-bold tabular-nums text-amber-900 dark:text-amber-200">
                {faMoney(chapter.amount)}
              </div>
            </div>
            <div className="text-left">
              <div className="text-[10px] text-muted-foreground">سهم</div>
              <div className="text-sm font-semibold tabular-nums">{faPct(pct)}</div>
            </div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", progressColor(pct))}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">
            {faRial(chapter.amount)}
          </div>
        </div>

        {chapter.isWorkshopSetup && chapter.workshopMode ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            حالت: <b>{chapter.workshopMode}</b>
          </div>
        ) : null}

        <Separator />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <AlertCircle className="size-3" />
            خودکار از برگه مالی
          </span>
          <span className="tabular-nums">
            {chapter.updatedAt ? new Date(chapter.updatedAt).toLocaleDateString("fa-IR") : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────
function ChaptersSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-3 h-32 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
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

export default ChaptersView;
