"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export interface Column<T> {
  key: string;
  header: string;
  align?: "start" | "center" | "end";
  className?: string;
  /** رندر سلول دسکتاپ */
  cell: (row: T) => React.ReactNode;
  /** برچسب در حالت کارت موبایل (اگر متفاوت باشد) */
  mobileLabel?: string;
  /** پنهان در حالت کارت موبایل */
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  /** سلول‌های ستون «اقدام» که در کارت موبایل پایین می‌آیند */
  onRowClick?: (row: T) => void;
  className?: string;
}

const alignClass = (a?: "start" | "center" | "end") =>
  a === "center" ? "text-center" : a === "end" ? "text-end" : "text-start";

export function ResponsiveTable<T>({
  columns, rows, rowKey, loading, emptyTitle = "موردی یافت نشد", emptyDescription, onRowClick, className,
}: ResponsiveTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  if (!rows.length) {
    return <div className="p-4"><EmptyState title={emptyTitle} description={emptyDescription} /></div>;
  }

  return (
    <div className={className}>
      {/* دسکتاپ: جدول واقعی */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-2.5 font-medium", alignClass(c.align))}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn("transition-colors hover:bg-muted/40", onRowClick && "cursor-pointer")}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-2.5 align-middle", alignClass(c.align), c.className)}>{c.cell(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* موبایل: کارت */}
      <div className="space-y-2 p-3 md:hidden">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            className={cn("rounded-lg border bg-card p-3", onRowClick && "cursor-pointer active:bg-muted/40")}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.filter((c) => !c.hideOnMobile).map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-2 py-1 text-sm">
                <span className="shrink-0 text-xs text-muted-foreground">{c.mobileLabel ?? c.header}</span>
                <span className="min-w-0 text-end">{c.cell(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
