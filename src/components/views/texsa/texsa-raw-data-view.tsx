"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Database, Search, Table, Download, ChevronLeft, ChevronRight,
  FileText, Copy, AlertCircle,
} from "lucide-react";
import { toFa } from "@/lib/fa";
import { exportToCSV } from "@/lib/export/export-utils";
import { cn } from "@/lib/utils";

export function TexsaRawDataView() {
  const [selectedImport, setSelectedImport] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize] = useState(50);

  // Get imports list
  const { data: importsData } = useQuery({
    queryKey: ["texsa-imports"],
    queryFn: async () => {
      const r = await fetch("/api/texsa/imports");
      return r.json();
    },
  });

  const imports = importsData?.imports || [];

  // Auto-select first import
  if (imports.length > 0 && !selectedImport) {
    setSelectedImport(imports[0].id);
  }

  // Get tables for selected import
  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ["texsa-tables", selectedImport],
    queryFn: async () => {
      const r = await fetch(`/api/texsa/imports/${selectedImport}/tables`);
      return r.json();
    },
    enabled: !!selectedImport,
  });

  const tables = tablesData?.tables || [];
  const tableNames = useMemo(() => {
    return tables
      .filter((t: any) => t.actualRowCount > 0)
      .sort((a: any, b: any) => b.actualRowCount - a.actualRowCount);
  }, [tables]);

  // Auto-select first table
  if (tableNames.length > 0 && !selectedTable) {
    setSelectedTable(tableNames[0].tableName);
  }

  // Get rows for selected table
  const { data: rowsData, isLoading: rowsLoading } = useQuery({
    queryKey: ["texsa-rows", selectedImport, selectedTable, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search,
      });
      const r = await fetch(
        `/api/texsa/imports/${selectedImport}/tables/${selectedTable}?${params}`
      );
      return r.json();
    },
    enabled: !!selectedImport && !!selectedTable,
  });

  const handleExport = () => {
    if (!rowsData?.rows || !rowsData?.columns) return;
    const headers = rowsData.columns.map((c: any) => c.name);
    const rows = rowsData.rows.map((r: any) =>
      rowsData.columns.map((c: any) => r[c.field] || "")
    );
    exportToCSV(`texsa-${selectedTable}`, headers, rows);
  };

  const handleCopyXml = (row: any) => {
    if (!rowsData?.columns || !selectedTable) return;
    let xml = `<${selectedTable}>\n`;
    for (const col of rowsData.columns) {
      xml += `  <${col.name}>${row[col.field] || ""}</${col.name}>\n`;
    }
    xml += `</${selectedTable}>`;
    navigator.clipboard.writeText(xml);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Database className="size-6 text-amber-600" />
            داده خام تکسا
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            مرور و جستجوی تمام جدول‌های تکسا با دسترسی مستقیم به داده‌های خام
          </p>
        </div>
        {rowsData && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
            <Download className="size-4" />
            خروجی CSV
          </Button>
        )}
      </div>

      {/* Import + Table selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">ایمپورت</label>
          <Select value={selectedImport} onValueChange={(v) => { setSelectedImport(v); setSelectedTable(""); setPage(1); }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="انتخاب ایمپورت..." /></SelectTrigger>
            <SelectContent>
              {imports.map((imp: any) => (
                <SelectItem key={imp.id} value={imp.id}>
                  {imp.projectName || imp.originalFileName} ({toFa(imp.totalRows)} ردیف)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">جدول</label>
          <Select value={selectedTable} onValueChange={(v) => { setSelectedTable(v); setPage(1); setSearch(""); }}>
            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="انتخاب جدول..." /></SelectTrigger>
            <SelectContent>
              {tableNames.map((t: any) => (
                <SelectItem key={t.tableName} value={t.tableName}>
                  {t.tableName} ({toFa(t.actualRowCount)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-muted-foreground">جستجو</label>
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="جستجو در تمام ستون‌ها..."
              className="h-9 pr-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Table info bar */}
      {rowsData && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">
            <Table className="size-2.5 ml-1" />
            {selectedTable}
          </Badge>
          <span>{toFa(rowsData.total)} ردیف</span>
          <span>•</span>
          <span>{toFa(rowsData.columns.length)} ستون</span>
          <span>•</span>
          <span>صفحه {toFa(rowsData.page)} از {toFa(rowsData.totalPages)}</span>
        </div>
      )}

      {/* Data table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {rowsLoading ? (
            <div className="p-4">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !rowsData?.rows?.length ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Database className="size-10 mx-auto mb-2 text-amber-300" />
              ردیفی یافت نشده
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card z-10 border-b">
                  <tr>
                    <th className="text-center p-2 font-medium w-12">#</th>
                    {rowsData.columns.map((col: any) => (
                      <th key={col.field} className="text-right p-2 font-medium whitespace-nowrap" title={col.name}>
                        {col.name}
                      </th>
                    ))}
                    <th className="text-center p-2 font-medium w-16">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsData.rows.map((row: any, idx: number) => (
                    <tr key={row.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 text-center text-muted-foreground tabular-nums">
                        {toFa((page - 1) * pageSize + idx + 1)}
                      </td>
                      {rowsData.columns.map((col: any) => {
                        const value = row[col.field];
                        const isNumber = col.type === "integer" || col.type === "number";
                        return (
                          <td
                            key={col.field}
                            className={cn(
                              "p-2 whitespace-nowrap max-w-[200px] truncate",
                              isNumber && "text-left tabular-nums",
                              !value && "text-muted-foreground/40"
                            )}
                            title={value || ""}
                          >
                            {value || "—"}
                          </td>
                        );
                      })}
                      <td className="p-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-muted-foreground hover:text-amber-600"
                          onClick={() => handleCopyXml(row)}
                          title="کپی XML"
                        >
                          <Copy className="size-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {rowsData && rowsData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronRight className="size-4" />
            قبلی
          </Button>
          <span className="text-xs text-muted-foreground px-2">
            {toFa(page)} / {toFa(rowsData.totalPages)}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={page >= rowsData.totalPages}
            onClick={() => setPage(page + 1)}
          >
            بعدی
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
