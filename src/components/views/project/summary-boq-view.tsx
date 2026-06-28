"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Layers,
  RefreshCw,
  ListTree,
  Info,
  Hash,
  Loader2,
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import { faNum, toFa } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ───────────────────────────────────────────────────────────
interface SummaryBoqItem {
  id: string;
  projectId: string;
  priceListItemId: string | null;
  code: string;
  description: string;
  unit: string;
  totalQuantity: number;
  updatedAt: string;
}

interface ProjectResponse {
  project: {
    id: string;
    name: string;
    code: string;
    summaryBoqs: SummaryBoqItem[];
    detailBoqs: { id: string }[];
  };
}

// ─── Main View ───────────────────────────────────────────────────────
export function SummaryBoqView() {
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

  const items = data?.project?.summaryBoqs ?? [];
  const detailCount = data?.project?.detailBoqs?.length ?? 0;
  const lastUpdated = items.length > 0
    ? items.reduce((m, i) => (i.updatedAt > m ? i.updatedAt : m), items[0].updatedAt)
    : null;

  const handleRecompute = async () => {
    // بازمحاسبه از طریق invalidate کوئری پروژه و refetch
    await qc.invalidateQueries({ queryKey: ["project", projectId] });
    await refetch();
    toast({
      title: "بازمحاسبه شد",
      description: (
        <span className="text-xs leading-5">
          خلاصه‌متره از {toFa(detailCount)} ردیف ریزمتره بازمحاسبه شد.
        </span>
      ),
    });
  };

  // ─── Empty / loading / error states ───
  if (!projectId) {
    return (
      <EmptyState
        icon={<Layers className="size-8" />}
        title="پروژه‌ای انتخاب نشده"
        description="یک پروژه را از نوار کناری انتخاب کنید تا خلاصه‌متره‌ی آن نمایش داده شود."
      />
    );
  }

  if (isLoading) {
    return <SummaryBoqSkeleton />;
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
            <Layers className="size-5 text-amber-600" />
            خلاصه متره
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            پروژه: <span className="font-medium text-foreground">{data?.project.name}</span>
            {lastUpdated && (
              <>
                {" — آخرین بازمحاسبه: "}
                <span className="font-medium text-foreground">
                  {new Date(lastUpdated).toLocaleString("fa-IR")}
                </span>
              </>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={handleRecompute}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          بازمحاسبه
        </Button>
      </div>

      {/* Info banner */}
      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
        <Info className="size-4" />
        <AlertTitle className="text-sm">نمای تجمیعی — فقط خواندنی</AlertTitle>
        <AlertDescription className="text-xs">
          این جدول به‌صورت خودکار از تجمیع ردیف‌های ریزمتره ساخته می‌شود. هر تغییری در ریزمتره،
          این مقادیر را به‌صورت زنجیره‌ای بازمحاسبه می‌کند. برای ویرایش، به تب «ریزمتره» مراجعه کنید.
        </AlertDescription>
      </Alert>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState
          icon={<ListTree className="size-8" />}
          title="خلاصه متره خالی است"
          description={
            detailCount > 0
              ? "ریزمتره ثبت شده اما تجمیع انجام نشده. روی «بازمحاسبه» کلیک کنید."
              : "ابتدا در تب «ریزمتره» ردیف‌هایی اضافه کنید تا خلاصه‌متره ساخته شود."
          }
          action={
            detailCount > 0 ? (
              <Button variant="outline" className="h-9" onClick={handleRecompute} disabled={isFetching}>
                <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
                بازمحاسبه
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-y-auto">
              <Table className="boq-table">
                <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="h-10 w-14 bg-muted/60 px-3 text-center font-medium">#</TableHead>
                    <TableHead className="h-10 bg-muted/60 px-3 font-medium">کد</TableHead>
                    <TableHead className="h-10 bg-muted/60 px-3 font-medium">شرح</TableHead>
                    <TableHead className="h-10 w-32 bg-muted/60 px-3 font-medium">واحد</TableHead>
                    <TableHead className="h-10 w-48 bg-muted/60 px-3 text-left font-medium">
                      <span className="flex items-center gap-1.5">
                        <Hash className="size-3.5 opacity-50" />
                        مقدار کل
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="px-3 text-center text-xs text-muted-foreground">
                        {toFa(idx + 1)}
                      </TableCell>
                      <TableCell className="px-3">
                        <Badge variant="outline" className="font-mono text-[11px]">
                          {item.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[40vw] px-3">
                        <div className="truncate text-sm" title={item.description}>
                          {item.description}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 text-xs text-muted-foreground">
                        {item.unit}
                      </TableCell>
                      <TableCell className="px-3 text-left">
                        <span className="rounded-md bg-amber-50 px-2 py-1 text-sm font-semibold tabular-nums text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                          {faNum(item.totalQuantity, 2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-4 py-2.5 text-xs">
              <span className="text-muted-foreground">
                تعداد کدهای یکتا:{" "}
                <b className="text-foreground">{toFa(items.length)}</b>
              </span>
              <span className="text-muted-foreground">
                مجموع مقدار کل:{" "}
                <b className="text-foreground tabular-nums">
                  {faNum(
                    items.reduce((s, i) => s + (i.totalQuantity || 0), 0),
                    2,
                  )}
                </b>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────
function SummaryBoqSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-16 w-full" />
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[70vh] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableHead key={i} className="bg-muted/40">
                      <Skeleton className="h-4 w-12" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, r) => (
                  <TableRow key={r}>
                    {Array.from({ length: 5 }).map((_, c) => (
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

export default SummaryBoqView;
