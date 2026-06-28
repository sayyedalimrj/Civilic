"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Building2, Users, Calendar, DollarSign, FileText, MapPin,
  Database, Table, AlertCircle, Download, Copy,
} from "lucide-react";
import { toFa } from "@/lib/fa";

export function TexsaProjectView() {
  const [selectedImport, setSelectedImport] = useState<string>("");

  const { data: importsData } = useQuery({
    queryKey: ["texsa-imports"],
    queryFn: async () => {
      const r = await fetch("/api/texsa/imports");
      return r.json();
    },
  });

  const imports = importsData?.imports || [];
  if (imports.length > 0 && !selectedImport) {
    setSelectedImport(imports[0].id);
  }

  // Get import details
  const { data: importDetail, isLoading } = useQuery({
    queryKey: ["texsa-import-detail", selectedImport],
    queryFn: async () => {
      const r = await fetch(`/api/texsa/imports/${selectedImport}`);
      return r.json();
    },
    enabled: !!selectedImport,
  });

  // Get contract data from brv_contract
  const { data: contractData } = useQuery({
    queryKey: ["texsa-contract", selectedImport],
    queryFn: async () => {
      const r = await fetch(
        `/api/texsa/imports/${selectedImport}/tables/brv_contract?pageSize=1`
      );
      return r.json();
    },
    enabled: !!selectedImport,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const contract = contractData?.rows?.[0] || {};
  const tableCounts = importDetail?.tableCounts || {};
  const warnings = importDetail?.warnings || [];
  const errors = importDetail?.errors || [];

  // Key table counts
  const keyTables = [
    "brv_rzmt", "brv_khmt", "brv_bgml", "brv_fhbh",
    "brv_type_situ", "brv_kosorat", "brv_ahta", "brv_mult",
    "brv_hmpy", "brv_sorc", "brv_acts",
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="size-6 text-amber-600" />
            {contract.tx_ctc_nmpj || "نمای کلی پیمان"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            کد: {contract.tx_ctc_id || "—"} • سال فهرست‌بها: {toFa(Number(contract.tx_ctc_yrfh) || 0) || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.open(`/api/texsa/imports/${selectedImport}/export`, "_blank")}
          >
            <Download className="size-4" />
            خروجی .svzt
          </Button>
        </div>
      </div>

      {/* Project info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <InfoCard icon={Users} label="کارفرما" value={contract.tx_ctc_nmci} color="amber" />
        <InfoCard icon={Users} label="پیمانکار" value={contract.tx_ctc_nmct} color="orange" />
        <InfoCard icon={Users} label="مشاور/ناظر" value={contract.tx_ctc_nmcs || contract.tx_ctc_neza} color="emerald" />
        <InfoCard icon={MapPin} label="محل پروژه" value={contract.tx_ctc_place} color="slate" />
        <InfoCard icon={DollarSign} label="مبلغ اولیه پیمان" value={contract.tx_ctc_pric_prim} color="rose" />
        <InfoCard icon={Calendar} label="سال فهرست‌بها" value={contract.tx_ctc_yrfh ? toFa(Number(contract.tx_ctc_yrfh)) : "—"} color="purple" />
        <InfoCard icon={FileText} label="نسخه" value={contract.tx_Version} color="cyan" />
        <InfoCard icon={Database} label="کل ردیف‌ها" value={toFa(importDetail?.import?.totalRows || 0)} color="slate" />
      </div>

      {/* Key table counts */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Table className="size-4 text-amber-600" />
            جدول‌های کلیدی تکسا
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 p-3">
            {keyTables.map((t) => {
              const count = tableCounts[t] || 0;
              return (
                <div
                  key={t}
                  className="rounded-md border p-2.5 hover:bg-muted/30 transition-colors cursor-default"
                >
                  <div className="text-[9px] font-mono text-muted-foreground truncate">{t}</div>
                  <div className="text-lg font-bold tabular-nums mt-0.5">{toFa(count)}</div>
                  <div className="text-[8px] text-muted-foreground">ردیف</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All tables summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="size-4 text-amber-600" />
            تمام جدول‌ها ({toFa(Object.keys(tableCounts).length)})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card border-b">
                <tr>
                  <th className="text-right p-2 font-medium">نام جدول</th>
                  <th className="text-left p-2 font-medium">ردیف</th>
                  <th className="text-center p-2 font-medium">سهم</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(tableCounts)
                  .sort(([, a]: any, [, b]: any) => b - a)
                  .map(([name, count]: any) => {
                    const total = importDetail?.import?.totalRows || 1;
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <tr key={name} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-mono">{name}</td>
                        <td className="p-2 text-left tabular-nums font-medium">{toFa(count)}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden min-w-[40px]">
                              <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="text-[9px] tabular-nums">{toFa(pct.toFixed(1))}٪</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {(warnings.length > 0 || errors.length > 0) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-600" />
              هشدارها و خطاها ({toFa(warnings.length + errors.length)})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-48 overflow-y-auto divide-y">
              {errors.map((err: any, i: number) => (
                <div key={`e${i}`} className="p-2 flex items-start gap-2 bg-rose-50/30 dark:bg-rose-950/10">
                  <Badge className="text-[8px] bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">ERROR</Badge>
                  <span className="text-[10px] text-muted-foreground">{err.message}</span>
                </div>
              ))}
              {warnings.map((warn: any, i: number) => (
                <div key={`w${i}`} className="p-2 flex items-start gap-2">
                  <Badge variant="outline" className="text-[8px] text-amber-600">{warn.severity}</Badge>
                  <span className="text-[10px] text-muted-foreground">{warn.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color }: {
  icon: typeof Building2; label: string; value: string | undefined; color: string;
}) {
  const colors: Record<string, string> = {
    amber: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-300",
    emerald: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 text-emerald-700 dark:text-emerald-300",
    rose: "from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 text-rose-700 dark:text-rose-300",
    slate: "from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 text-slate-700 dark:text-slate-300",
    orange: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 text-orange-700 dark:text-orange-300",
    cyan: "from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 text-cyan-700 dark:text-cyan-300",
    purple: "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 text-purple-700 dark:text-purple-300",
  };
  return (
    <Card className={`border-0 shadow-sm bg-gradient-to-br ${colors[color] || colors.amber}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <Icon className="size-3.5 opacity-60" />
        </div>
        <div className="text-xs font-bold truncate">{value || "—"}</div>
      </CardContent>
    </Card>
  );
}
