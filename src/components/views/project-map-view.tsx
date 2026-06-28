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
  MapPin, Building2, TrendingUp, Wallet, Navigation,
} from "lucide-react";
import { faMoney, toFa } from "@/lib/fa";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface MapProject {
  id: string;
  name: string;
  code: string;
  status: string;
  location: string | null;
  lat: number;
  lng: number;
  contractAmount: number;
  progress: number;
  year: number;
}

interface MapData {
  projects: MapProject[];
  summary: {
    total: number;
    mapped: number;
    active: number;
    draft: number;
    totalContract: number;
    avgProgress: number;
  };
}

const STATUS_META: Record<string, { label: string; color: string; pin: string }> = {
  ACTIVE: { label: "فعال", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300", pin: "bg-emerald-500" },
  DRAFT: { label: "پیش‌نویس", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300", pin: "bg-amber-500" },
  CLOSED: { label: "بسته‌شده", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300", pin: "bg-slate-500" },
};

export function ProjectMapView() {
  const { selectProject } = useAppStore();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data, isLoading } = useQuery<MapData>({
    queryKey: ["project-map"],
    queryFn: async () => {
      const r = await fetch("/api/projects/map");
      return r.json();
    },
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

  if (!data) return null;

  const { projects, summary } = data;

  // محاسبه‌ی مرکز نقشه (میانگین مختصات)
  const centerLat = projects.length > 0
    ? projects.reduce((s, p) => s + p.lat, 0) / projects.length
    : 35.7;
  const centerLng = projects.length > 0
    ? projects.reduce((s, p) => s + p.lng, 0) / projects.length
    : 51.4;

  // محاسبه‌ی bounds برای scale
  const lats = projects.map((p) => p.lat);
  const lngs = projects.map((p) => p.lng);
  const minLat = Math.min(...lats, centerLat - 0.1);
  const maxLat = Math.max(...lats, centerLat + 0.1);
  const minLng = Math.min(...lngs, centerLng - 0.1);
  const maxLng = Math.max(...lngs, centerLng + 0.1);

  // تبدیل مختصات به درصد برای نمایش روی نقشه SVG
  const latToY = (lat: number) => {
    const range = maxLat - minLat || 0.1;
    return ((maxLat - lat) / range) * 100;
  };
  const lngToX = (lng: number) => {
    const range = maxLng - minLng || 0.1;
    return ((lng - minLng) / range) * 100;
  };

  const selected = projects.find((p) => p.id === selectedProject);

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="size-6 text-amber-600" />
          نقشه‌ی جغرافیایی پروژه‌ها
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          موقعیت پروژه‌های سازمان روی نقشه با اطلاعات خلاصه
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard icon={Building2} label="کل پروژه‌ها" value={toFa(summary.total)} sub={`${toFa(summary.mapped)} دارای مختصات`} color="amber" />
        <KPICard icon={TrendingUp} label="میانگین پیشرفت" value={`${toFa(summary.avgProgress.toFixed(0))}٪`} sub={`${toFa(summary.active)} فعال • ${toFa(summary.draft)} پیش‌نویس`} color="emerald" />
        <KPICard icon={Wallet} label="مبلغ کل پیمان" value={faMoney(summary.totalContract)} sub="مجموع قراردادها" color="orange" />
        <KPICard icon={MapPin} label="مناطق فعال" value={toFa(new Set(projects.map((p) => p.location)).size)} sub="شهر/منطقه" color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Navigation className="size-4 text-amber-600" />
              نقشه‌ی پروژه‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-[500px] rounded-lg overflow-hidden border bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
              {/* Grid pattern */}
              <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Map labels */}
              <div className="absolute top-2 left-2 text-[10px] text-muted-foreground font-mono">
                شمال (N)
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground font-mono">
                {toFa(centerLat.toFixed(4))}°N, {toFa(centerLng.toFixed(4))}°E
              </div>

              {/* Project pins */}
              {projects.map((p) => {
                const meta = STATUS_META[p.status] || STATUS_META.DRAFT;
                const x = lngToX(p.lng);
                const y = latToY(p.lat);
                const isSelected = selectedProject === p.id;
                const pinSize = Math.max(12, Math.min(28, p.contractAmount / 200000000));

                return (
                  <button
                    key={p.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:z-20"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => setSelectedProject(p.id)}
                  >
                    {/* Pulse for active projects */}
                    {p.status === "ACTIVE" && (
                      <span className={cn("absolute inset-0 rounded-full animate-ping opacity-30", meta.pin)} />
                    )}
                    {/* Pin */}
                    <div
                      className={cn(
                        "relative rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white dark:border-slate-900 transition-transform hover:scale-125",
                        meta.pin,
                        isSelected && "ring-4 ring-amber-400 scale-125"
                      )}
                      style={{ width: pinSize, height: pinSize }}
                    >
                      <MapPin className="size-3" />
                    </div>
                    {/* Label */}
                    <div className={cn(
                      "absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[9px] font-medium bg-card px-1.5 py-0.5 rounded shadow-sm border transition-opacity",
                      isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"
                    )}>
                      {p.name.length > 15 ? p.name.slice(0, 15) + "…" : p.name}
                    </div>
                  </button>
                );
              })}

              {/* Selected project detail popup */}
              {selected && (
                <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 bg-card rounded-lg shadow-xl border p-3 z-30">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold">{selected.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {selected.code} • {selected.location}
                      </div>
                    </div>
                    <Badge className={cn("text-[9px]", STATUS_META[selected.status]?.color)}>
                      {STATUS_META[selected.status]?.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                    <div>
                      <div className="text-[9px] text-muted-foreground">مبلغ پیمان</div>
                      <div className="font-bold tabular-nums">{faMoney(selected.contractAmount)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-muted-foreground">پیشرفت</div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              selected.progress >= 75 ? "bg-emerald-500" :
                              selected.progress >= 40 ? "bg-amber-500" : "bg-rose-500"
                            )}
                            style={{ width: `${Math.min(selected.progress, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold tabular-nums">{toFa(selected.progress.toFixed(0))}٪</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] text-muted-foreground mb-2">
                    مختصات: {toFa(selected.lat.toFixed(4))}°N, {toFa(selected.lng.toFixed(4))}°E
                  </div>
                  <Button
                    size="sm"
                    className="w-full h-7 text-[11px] bg-amber-600 hover:bg-amber-700"
                    onClick={() => selectProject(selected.id, "overview")}
                  >
                    مشاهده‌ی جزئیات پروژه
                  </Button>
                </div>
              )}

              {/* Legend */}
              <div className="absolute top-2 right-2 bg-card/90 backdrop-blur rounded-md border p-2 space-y-1">
                <div className="text-[9px] font-semibold text-muted-foreground mb-1">راهنما</div>
                {Object.entries(STATUS_META).map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-1.5 text-[9px]">
                    <div className={cn("size-2.5 rounded-full", meta.pin)} />
                    <span>{meta.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project List */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="size-4 text-amber-600" />
              لیست پروژه‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[450px] overflow-y-auto">
              {projects.map((p) => {
                const meta = STATUS_META[p.status] || STATUS_META.DRAFT;
                const isSelected = selectedProject === p.id;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                      isSelected ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : "hover:bg-muted/30"
                    )}
                    onClick={() => setSelectedProject(p.id)}
                  >
                    <div className={cn("size-2 rounded-full mt-1.5 shrink-0", meta.pin)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{p.name}</div>
                      <div className="text-[9px] text-muted-foreground font-mono">
                        {p.code} • {p.location}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-[8px] h-3.5", meta.color)}>
                          {meta.label}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground tabular-nums">
                          {toFa(p.progress.toFixed(0))}٪
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Need to import useState - already imported above

function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Building2; label: string; value: string; sub: string;
  color: "amber" | "emerald" | "rose" | "slate" | "orange";
}) {
  const colors = {
    amber: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-300",
    emerald: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 text-emerald-700 dark:text-emerald-300",
    rose: "from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 text-rose-700 dark:text-rose-300",
    slate: "from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 text-slate-700 dark:text-slate-300",
    orange: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 text-orange-700 dark:text-orange-300",
  };
  return (
    <Card className={cn("border-0 shadow-sm bg-gradient-to-br", colors[color])}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">{label}</span>
          <Icon className="size-3.5 opacity-60" />
        </div>
        <div className="text-base font-bold tabular-nums">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</div>
      </CardContent>
    </Card>
  );
}
