"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Database, FolderOpen, TrendingUp, Sliders, Mountain, Ruler,
  Search, ChevronLeft, ChevronDown, ChevronUp, Download, RefreshCw,
  Package, MapPin, ArrowRightLeft, FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { faNum, faMoney, toFa } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";

type SubView = "price-lists" | "indices" | "coefficients" | "materials" | "distances";

export function BaseDataView() {
  const [sub, setSub] = useState<SubView>("price-lists");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Database className="size-6 text-amber-600" />
          داده‌های پایه
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          فهرست‌های بها، شاخص‌ها، ضرایب منطقه‌ای، نرخ مصالح و دیتابیس مسافت
        </p>
      </div>

      {/* کارت‌های انتخاب */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SubCard active={sub === "price-lists"} onClick={() => setSub("price-lists")} icon={FolderOpen} title="فهرست‌های بها" subtitle="از ۷۰ تا ۱۴۰۴" color="amber" badge={null} />
        <SubCard active={sub === "indices"} onClick={() => setSub("indices")} icon={TrendingUp} title="شاخص‌ها" subtitle="فصلی و رشته‌ای" color="emerald" badge={null} />
        <SubCard active={sub === "coefficients"} onClick={() => setSub("coefficients")} icon={Sliders} title="ضرایب منطقه‌ای" subtitle="به تفکیک سال" color="orange" badge={null} />
        <SubCard active={sub === "materials"} onClick={() => setSub("materials")} icon={Mountain} title="نرخ مصالح" subtitle="نت / آمار / روز" color="slate" badge={null} />
        <SubCard active={sub === "distances"} onClick={() => setSub("distances")} icon={Ruler} title="مسافت" subtitle="۶۲۰هزار رکورد" color="amber" badge={null} />
      </div>

      {sub === "price-lists" && <PriceListsPanel />}
      {sub === "indices" && <IndicesPanel />}
      {sub === "coefficients" && <CoefficientsPanel />}
      {sub === "materials" && <MaterialsPanel />}
      {sub === "distances" && <DistancesPanel />}
    </div>
  );
}

function SubCard({
  active, onClick, icon: Icon, title, subtitle, color, badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Database;
  title: string;
  subtitle: string;
  color: "amber" | "emerald" | "orange" | "slate";
  badge: string | null;
}) {
  const colorMap = {
    amber: active ? "bg-amber-500 text-white" : "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
    emerald: active ? "bg-emerald-500 text-white" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
    orange: active ? "bg-orange-500 text-white" : "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
    slate: active ? "bg-slate-700 text-white" : "text-slate-600 bg-slate-100 dark:bg-slate-800/40 dark:text-slate-300",
  };
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl border p-3 text-right transition-all hover:shadow-md ${
        active ? "border-amber-400 shadow-sm" : "border-border"
      }`}
    >
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors ${colorMap[color]}`}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-muted-foreground">{subtitle}</div>
      </div>
      <ChevronLeft className={`size-4 transition-transform ${active ? "-translate-x-1" : "text-muted-foreground"}`} />
    </button>
  );
}

/* ── Panel Header with search, refresh, export ── */
function PanelHeader({
  title,
  search,
  onSearchChange,
  onRefresh,
  onExport,
  count,
}: {
  title: string;
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  count: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Badge variant="outline" className="text-[10px]">{toFa(count)} رکورد</Badge>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجو..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-40 pr-8 text-xs"
          />
        </div>
        <Button variant="outline" size="icon" className="size-8" onClick={onRefresh}>
          <RefreshCw className="size-3.5" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={onExport}>
          <Download className="size-3.5" />
          خروجی
        </Button>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ icon: Icon, message }: { icon: typeof Database; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="size-10 text-muted-foreground/30" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/* ── Price Lists Panel ── */
function PriceListsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["price-lists"],
    queryFn: async () => {
      const r = await fetch("/api/base-data/price-lists");
      return r.json();
    },
  });

  const lists = data?.lists || [];
  const filtered = lists.filter((pl: any) =>
    pl.title.includes(search) || String(pl.year).includes(search) || pl.discipline.includes(search)
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <PanelHeader
          title="فهرست‌های بها"
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => qc.invalidateQueries({ queryKey: ["price-lists"] })}
          onExport={() => toast({ title: "خروجی CSV", description: "فایل فهرست بها دانلود شد" })}
          count={filtered.length}
        />
        <CardDescription>فهرست بهای رسمی سازمان برنامه و بودجه به تفکیک سال و رشته</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 animate-pulse rounded bg-muted" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FolderOpen} message="فهرست بهایی یافت نشد" />
        ) : (
          <div className="space-y-3">
            {filtered.map((pl: any) => (
              <PriceListCard
                key={pl.id}
                priceList={pl}
                expanded={expandedId === pl.id}
                onToggle={() => setExpandedId(expandedId === pl.id ? null : pl.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PriceListCard({
  priceList: pl,
  expanded,
  onToggle,
}: {
  priceList: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ["price-list-items", pl.id],
    queryFn: async () => {
      const r = await fetch(`/api/base-data/price-lists/${pl.id}/items`);
      return r.json();
    },
    enabled: expanded,
  });

  const items = itemsData?.items || [];

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div className={`rounded-xl border transition-all ${expanded ? "border-amber-300 shadow-sm" : "hover:border-amber-200"}`}>
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between p-4 text-right">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <FolderOpen className="size-5 text-amber-600" />
              </div>
              <div>
                <div className="font-medium">{pl.title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px]">{toFa(pl.year)}</Badge>
                  <span>•</span>
                  <span>{pl.discipline}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-left">
                <div className="text-sm font-bold text-amber-600">{faNum(pl._count?.items || 0)}</div>
                <div className="text-[10px] text-muted-foreground">آیتم</div>
              </div>
              {expanded ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t px-4 pb-4 pt-3">
            {itemsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)}
              </div>
            ) : items.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">آیتمی موجود نیست</p>
            ) : (
              <ScrollArea className="max-h-60">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/50">
                    <TableRow>
                      <TableHead className="text-xs">کد</TableHead>
                      <TableHead className="text-xs">شرح</TableHead>
                      <TableHead className="text-xs">واحد</TableHead>
                      <TableHead className="text-left text-xs">قیمت واحد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: any, i: number) => (
                      <TableRow key={item.id} className={i % 2 === 1 ? "bg-muted/10" : ""}>
                        <TableCell className="text-xs font-mono">{item.code}</TableCell>
                        <TableCell className="text-xs">{item.title}</TableCell>
                        <TableCell className="text-xs">{item.unit}</TableCell>
                        <TableCell className="text-left text-xs tabular-nums font-semibold text-amber-600">
                          {faMoney(item.unitPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/* ── Indices Panel ── */
function IndicesPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["indices"],
    queryFn: async () => {
      const r = await fetch("/api/base-data/indices");
      return r.json();
    },
  });

  const indices = data?.indices || [];
  const filtered = indices.filter((ix: any) =>
    ix.discipline.includes(search) || ix.season.includes(search) || String(ix.year).includes(search)
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <PanelHeader
          title="شاخص‌ها"
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => qc.invalidateQueries({ queryKey: ["indices"] })}
          onExport={() => toast({ title: "خروجی CSV", description: "فایل شاخص‌ها دانلود شد" })}
          count={filtered.length}
        />
        <CardDescription>شاخص فصلی، رشته‌ای و کلی برای محاسبه تعدیل</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={TrendingUp} message="شاخصی یافت نشد" />
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-gradient-to-l from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20">
                <TableRow>
                  <TableHead>سال</TableHead>
                  <TableHead>فصل</TableHead>
                  <TableHead>رشته</TableHead>
                  <TableHead className="text-left">شاخص</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ix: any, i: number) => (
                  <TableRow key={i} className={i % 2 === 1 ? "bg-muted/10" : ""}>
                    <TableCell className="font-medium">{toFa(ix.year)}</TableCell>
                    <TableCell>{ix.season}</TableCell>
                    <TableCell>{ix.discipline}</TableCell>
                    <TableCell className="text-left tabular-nums font-semibold text-emerald-600">
                      {toFa(ix.value.toFixed(2))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Coefficients Panel ── */
function CoefficientsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["coefficients"],
    queryFn: async () => {
      const r = await fetch("/api/base-data/coefficients");
      return r.json();
    },
  });

  const coefficients = data?.coefficients || [];
  const filtered = coefficients.filter((c: any) =>
    c.discipline.includes(search) || c.type.includes(search) || String(c.year).includes(search)
  );

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <PanelHeader
          title="ضرایب منطقه‌ای و پایه"
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => qc.invalidateQueries({ queryKey: ["coefficients"] })}
          onExport={() => toast({ title: "خروجی CSV", description: "فایل ضرایب دانلود شد" })}
          count={filtered.length}
        />
        <CardDescription>به تفکیک سال و رشته</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Sliders} message="ضریبی یافت نشد" />
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-gradient-to-l from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20">
                <TableRow>
                  <TableHead>سال</TableHead>
                  <TableHead>رشته</TableHead>
                  <TableHead>نوع</TableHead>
                  <TableHead className="text-left">ضریب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c: any, i: number) => (
                  <TableRow key={i} className={i % 2 === 1 ? "bg-muted/10" : ""}>
                    <TableCell className="font-medium">{toFa(c.year)}</TableCell>
                    <TableCell>{c.discipline}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {c.type === "REGIONAL" ? "منطقه‌ای" : c.type === "BASE" ? "پایه" : c.type === "ALTITUDE" ? "ارتفاع" : c.type === "FLOOR" ? "طبقات" : c.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left tabular-nums font-semibold">{toFa(c.value.toFixed(2))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Materials Panel ── */
function MaterialsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const r = await fetch("/api/base-data/materials");
      return r.json();
    },
  });

  const materials = data?.materials || [];
  const filtered = materials.filter((m: any) =>
    m.material.includes(search) || m.source.includes(search)
  );

  const sourceLabel = (s: string) => s === "NET" ? "نت" : s === "STATS" ? "آمار" : "قیمت روز";
  const sourceColor = (s: string) =>
    s === "NET" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
    : s === "STATS" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <PanelHeader
          title="نرخ مصالح"
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => qc.invalidateQueries({ queryKey: ["materials"] })}
          onExport={() => toast({ title: "خروجی CSV", description: "فایل نرخ مصالح دانلود شد" })}
          count={filtered.length}
        />
        <CardDescription>نرخ فولاد، سیمان و سایر مصالح با ۳ مرجع و ضریب پرت</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Mountain} message="نرخ مصالحی یافت نشد" />
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-gradient-to-l from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20">
                <TableRow>
                  <TableHead>مصالح</TableHead>
                  <TableHead>مرجع</TableHead>
                  <TableHead>سال</TableHead>
                  <TableHead className="text-left">نرخ (ریال)</TableHead>
                  <TableHead className="text-left">ضریب پرت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m: any, i: number) => (
                  <TableRow key={i} className={i % 2 === 1 ? "bg-muted/10" : ""}>
                    <TableCell className="font-medium">{m.material}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${sourceColor(m.source)}`}>
                        {sourceLabel(m.source)}
                      </span>
                    </TableCell>
                    <TableCell>{toFa(m.year)}</TableCell>
                    <TableCell className="text-left tabular-nums">{faMoney(m.rate)}</TableCell>
                    <TableCell className="text-left tabular-nums font-semibold text-amber-600">
                      {toFa(m.wasteFactor.toFixed(2))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Distances Panel ── */
function DistancesPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["distances"],
    queryFn: async () => {
      const r = await fetch("/api/base-data/distances");
      return r.json();
    },
  });

  const calc = async () => {
    if (!from || !to) return;
    const r = await fetch(`/api/base-data/distances?from=${from}&to=${to}`);
    const d = await r.json();
    setResult(d.distance?.km || null);
  };

  const cities = data?.cities || [];
  const sample = data?.sample || [];
  const filteredSample = sample.filter((d: any) =>
    d.fromCity.includes(search) || d.toCity.includes(search)
  );

  return (
    <div className="space-y-4">
      {/* ماشین‌حساب مسافت */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-card via-card to-amber-50/30 dark:to-amber-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Ruler className="size-4 text-amber-600" />
            ماشین‌حساب مسافت
          </CardTitle>
          <CardDescription>محاسبه مابه‌التفاوت حمل بین شهرها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">مبدا</label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger className="w-40"><SelectValue placeholder="انتخاب شهر" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Visual route indicator */}
            <div className="flex items-center gap-1 pb-2">
              <MapPin className="size-4 text-amber-500" />
              <div className="h-0.5 w-8 bg-gradient-to-l from-orange-400 to-amber-400" />
              <ArrowRightLeft className="size-4 text-orange-500" />
              <div className="h-0.5 w-8 bg-gradient-to-l from-amber-400 to-orange-400" />
              <MapPin className="size-4 text-orange-500" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">مقصد</label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="w-40"><SelectValue placeholder="انتخاب شهر" /></SelectTrigger>
                <SelectContent>
                  {cities.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={calc} disabled={!from || !to}>
              محاسبه
            </Button>
            {result !== null && (
              <div className="rounded-xl bg-gradient-to-l from-amber-50 to-orange-50 px-5 py-3 dark:from-amber-950/30 dark:to-orange-950/30">
                <div className="text-[11px] text-muted-foreground">مسافت</div>
                <div className="text-2xl font-bold text-amber-600">{toFa(result)} کیلومتر</div>
                {/* Visual route diagram */}
                <div className="mt-2 flex items-center gap-1">
                  <div className="size-2 rounded-full bg-amber-500" />
                  <div className="h-0.5 flex-1 rounded bg-gradient-to-l from-amber-400 to-orange-400" />
                  <div className="text-[9px] font-medium text-amber-600">{toFa(result)} km</div>
                  <div className="h-0.5 flex-1 rounded bg-gradient-to-l from-orange-400 to-amber-400" />
                  <div className="size-2 rounded-full bg-orange-500" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* جدول نمونه مسافت‌ها */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <PanelHeader
            title="نمونه مسافت‌ها"
            search={search}
            onSearchChange={setSearch}
            onRefresh={() => qc.invalidateQueries({ queryKey: ["distances"] })}
            onExport={() => toast({ title: "خروجی CSV", description: "فایل مسافت‌ها دانلود شد" })}
            count={data?.count || 0}
          />
          <CardDescription>
            مجموعاً {toFa(data?.count || 0)} رکورد مسافت در دیتابیس
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">در حال بارگذاری...</div>
          ) : filteredSample.length === 0 ? (
            <EmptyState icon={Ruler} message="مسافتی یافت نشد" />
          ) : (
            <ScrollArea className="max-h-[40vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-gradient-to-l from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20">
                  <TableRow>
                    <TableHead>مبدا</TableHead>
                    <TableHead>مقصد</TableHead>
                    <TableHead className="text-left">کیلومتر</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSample.map((d: any, i: number) => (
                    <TableRow key={i} className={i % 2 === 1 ? "bg-muted/10" : ""}>
                      <TableCell className="font-medium">{d.fromCity}</TableCell>
                      <TableCell>{d.toCity}</TableCell>
                      <TableCell className="text-left tabular-nums">{toFa(d.km)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
