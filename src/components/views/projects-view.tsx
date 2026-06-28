"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  HardHat,
  MapPin,
  Calendar,
  FileText,
  Search,
  LayoutGrid,
  List,
  Building2,
  Mountain,
  Construction,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Pencil,
  Eye,
  FileBarChart,
  Filter,
  FolderSearch,
  Loader2,
  FolderPlus,
  Sparkles,
  Clock,
  Route,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { faMoney, faNum, faPct, toFa, toJalali, progressColor } from "@/lib/fa";
import { ProjectWizard } from "./project/project-wizard";

/* ───────────────────────── helpers ───────────────────────── */

type ProjectType = "مترو" | "پل" | "تونل" | "ابنیه" | "راه و باند";

function detectType(name: string = ""): ProjectType {
  const n = name.toLowerCase();
  if (n.includes("مترو") || n.includes("metro")) return "مترو";
  if (n.includes("پل") || n.includes("bridge")) return "پل";
  if (n.includes("تونل") || n.includes("tunnel")) return "تونل";
  if (n.includes("راه") || n.includes("باند") || n.includes("road")) return "راه و باند";
  return "ابنیه";
}

function typeMeta(type: ProjectType) {
  switch (type) {
    case "مترو":
      return {
        Icon: HardHat,
        gradient: "from-amber-500 to-orange-600",
        accent: "text-amber-600",
        chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        ring: "ring-amber-300",
      };
    case "پل":
      return {
        Icon: Construction,
        gradient: "from-orange-500 to-rose-600",
        accent: "text-orange-600",
        chip: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
        ring: "ring-orange-300",
      };
    case "تونل":
      return {
        Icon: Mountain,
        gradient: "from-slate-500 to-slate-700",
        accent: "text-slate-600",
        chip: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
        ring: "ring-slate-300",
      };
    case "راه و باند":
      return {
        Icon: Route,
        gradient: "from-amber-600 to-amber-800",
        accent: "text-amber-700",
        chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        ring: "ring-amber-300",
      };
    default:
      return {
        Icon: Building2,
        gradient: "from-amber-600 to-orange-800",
        accent: "text-amber-700",
        chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        ring: "ring-amber-300",
      };
  }
}

function statusMeta(status: string) {
  if (status === "ACTIVE")
    return {
      label: "فعال",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      bar: "bg-emerald-500",
      dot: "bg-emerald-500",
    };
  if (status === "CLOSED")
    return {
      label: "مختومه",
      badge: "bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300",
      bar: "bg-slate-400",
      dot: "bg-slate-400",
    };
  return {
    label: "پیش‌نویس",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
  };
}

function projectProgress(p: any): number {
  const total = p?.cachedTotal || p?.contractAmount || 0;
  const exec = p?.cachedExecuted || 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.round((exec / total) * 100));
}

function relativeTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "—";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "لحظاتی پیش";
  if (mins < 60) return `${toFa(mins)} دقیقه پیش`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${toFa(hrs)} ساعت پیش`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${toFa(days)} روز پیش`;
  return toJalali(new Date(dateStr));
}

/* ─── circular progress ring (SVG) ─── */
function CircularProgress({
  value,
  size = 56,
  strokeWidth = 5,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const color =
    value >= 85 ? "#16a34a" : value >= 50 ? "#d97706" : value >= 25 ? "#ea580c" : "#dc2626";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold tabular-nums">{toFa(value)}٪</span>
      </div>
    </div>
  );
}

/* ───────────────────────── main view ───────────────────────── */

export function ProjectsView() {
  const { selectProject } = useAppStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "ACTIVE" | "DRAFT" | "CLOSED">("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "amount" | "progress">("newest");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const r = await fetch("/api/projects");
      return r.json();
    },
  });

  const allProjects: any[] = data?.projects || [];

  // year options extracted from projects
  const yearOptions = useMemo(() => {
    const set = new Set<number>();
    allProjects.forEach((p) => set.add(Number(p.year)));
    return Array.from(set).sort((a, b) => b - a);
  }, [allProjects]);

  // filtered + sorted projects
  const projects = useMemo(() => {
    let arr = allProjects.filter((p) => {
      const q = search.trim();
      const matches =
        !q ||
        p.name?.includes(q) ||
        p.code?.includes(q) ||
        (p.location || "").includes(q);
      const matchesStatus = statusTab === "all" || p.status === statusTab;
      const matchesYear =
        yearFilter === "all" || String(p.year) === yearFilter;
      return matches && matchesStatus && matchesYear;
    });
    if (sortBy === "newest") arr = arr.slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sortBy === "name") arr = arr.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "", "fa"));
    if (sortBy === "amount") arr = arr.slice().sort((a, b) => (b.contractAmount || 0) - (a.contractAmount || 0));
    if (sortBy === "progress") arr = arr.slice().sort((a, b) => projectProgress(b) - projectProgress(a));
    return arr;
  }, [allProjects, search, statusTab, yearFilter, sortBy]);

  // summary banner data
  const summary = useMemo(() => {
    const totalContract = allProjects.reduce((s, p) => s + (p.contractAmount || 0), 0);
    const totalExecuted = allProjects.reduce((s, p) => s + (p.cachedExecuted || 0), 0);
    const active = allProjects.filter((p) => p.status === "ACTIVE").length;
    const draft = allProjects.filter((p) => p.status === "DRAFT").length;
    const closed = allProjects.filter((p) => p.status === "CLOSED").length;
    return { totalContract, totalExecuted, total: allProjects.length, active, draft, closed };
  }, [allProjects]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* هدر */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <span className="bg-gradient-to-l from-amber-500 to-orange-600 bg-clip-text text-transparent">
              پروژه‌ها
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت پروژه‌های سازمان —{" "}
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              {toFa(projects.length)}
            </span>{" "}
            از {toFa(allProjects.length)} پروژه
          </p>
        </div>
        <Button
          onClick={() => setWizardOpen(true)}
          className="bg-gradient-to-l from-amber-500 to-orange-600 text-white shadow-sm hover:from-amber-600 hover:to-orange-700"
        >
          <Plus className="ml-1.5 size-4" />
          پروژه جدید
        </Button>
      </div>

      {/* بنر خلاصه */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="مجموع مبالغ پیمان"
          value={faMoney(summary.totalContract)}
          icon={<Wallet className="size-5" />}
          gradient="from-amber-500 to-orange-600"
          sub={`${toFa(allProjects.length)} پروژه`}
        />
        <SummaryCard
          label="مجموع اجرا شده"
          value={faMoney(summary.totalExecuted)}
          icon={<TrendingUp className="size-5" />}
          gradient="from-emerald-500 to-teal-600"
          sub={`${faPct(summary.totalContract > 0 ? (summary.totalExecuted / summary.totalContract) * 100 : 0)} پیشرفت کلی`}
        />
        <SummaryCard
          label="پروژه‌های فعال"
          value={`${toFa(summary.active)} / ${toFa(summary.total)}`}
          icon={<HardHat className="size-5" />}
          gradient="from-orange-500 to-rose-600"
          sub={`${toFa(summary.draft)} پیش‌نویس • ${toFa(summary.closed)} مختومه`}
        />
        <SummaryCard
          label="میانگین مبلغ پیمان"
          value={faMoney(summary.total > 0 ? summary.totalContract / summary.total : 0)}
          icon={<Sparkles className="size-5" />}
          gradient="from-slate-500 to-slate-700"
          sub="برای هر پروژه"
        />
      </div>

      {/* فیلتر و جستجو */}
      <Card className="shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-3 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجوی نام، کد یا موقعیت..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>

          {/* تب‌های وضعیت */}
          <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as any)}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs">
                همه <span className="mr-1 text-[10px] opacity-70">{toFa(allProjects.length)}</span>
              </TabsTrigger>
              <TabsTrigger value="ACTIVE" className="text-xs">
                فعال <span className="mr-1 text-[10px] opacity-70">{toFa(summary.active)}</span>
              </TabsTrigger>
              <TabsTrigger value="DRAFT" className="text-xs">
                پیش‌نویس <span className="mr-1 text-[10px] opacity-70">{toFa(summary.draft)}</span>
              </TabsTrigger>
              <TabsTrigger value="CLOSED" className="text-xs">
                مختومه <span className="mr-1 text-[10px] opacity-70">{toFa(summary.closed)}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* فیلتر سال */}
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="h-9 w-[130px]">
              <Calendar className="ml-1.5 size-3.5 text-muted-foreground" />
              <SelectValue placeholder="سال" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه سال‌ها</SelectItem>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  سال {toFa(y)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* مرتب‌سازی */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="h-9 w-[140px]">
              <Filter className="ml-1.5 size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">جدیدترین</SelectItem>
              <SelectItem value="name">نام (الفبا)</SelectItem>
              <SelectItem value="amount">مبلغ پیمان</SelectItem>
              <SelectItem value="progress">درصد پیشرفت</SelectItem>
            </SelectContent>
          </Select>

          {/* تغییر نما */}
          <div className="flex rounded-lg border p-0.5">
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("grid")}
              className="h-8 gap-1.5"
            >
              <LayoutGrid className="size-3.5" /> کارت
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="h-8 gap-1.5"
            >
              <List className="size-3.5" /> لیست
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* محتوا */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState search={search} onClear={() => { setSearch(""); setStatusTab("all"); setYearFilter("all"); }} onCreate={() => setWizardOpen(true)} />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              onOpen={() => selectProject(p.id)}
              onEdit={() => selectProject(p.id, "overview")}
              onReports={() => selectProject(p.id, "export")}
            />
          ))}
          {/* کارت نقطه‌چین پروژه جدید */}
          <button
            onClick={() => setWizardOpen(true)}
            className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-6 text-center transition-all hover:border-amber-500 hover:bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/10 dark:hover:border-amber-600 dark:hover:bg-amber-950/20"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md transition-transform group-hover:scale-110">
              <Plus className="size-7" />
            </div>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">ایجاد پروژه جدید</p>
              <p className="mt-1 text-xs text-muted-foreground">
                با ویزارد ۴ مرحله‌ای، پروژه را بسازید
              </p>
            </div>
          </button>
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ScrollArea className="max-h-[70vh]">
              <div className="divide-y">
                {projects.map((p) => (
                  <ProjectRow
                    key={p.id}
                    p={p}
                    onOpen={() => selectProject(p.id)}
                    onEdit={() => selectProject(p.id, "overview")}
                    onReports={() => selectProject(p.id, "export")}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <ProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}

/* ───────────────────────── sub-components ───────────────────────── */

function SummaryCard({
  label,
  value,
  icon,
  gradient,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  sub?: string;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] text-muted-foreground">{label}</p>
          <p className="truncate text-base font-bold tabular-nums sm:text-lg">{value}</p>
          {sub && <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectCard({
  p,
  onOpen,
  onEdit,
  onReports,
}: {
  p: any;
  onOpen: () => void;
  onEdit: () => void;
  onReports: () => void;
}) {
  const type = detectType(p.name);
  const meta = typeMeta(type);
  const status = statusMeta(p.status);
  const progress = projectProgress(p);
  const Icon = meta.Icon;

  return (
    <Card
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden border-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* نوار رنگی بالا */}
      <div className={`h-1.5 w-full ${status.bar}`} />

      <CardContent className="space-y-3 p-4">
        {/* هدر: آیکن + بج وضعیت */}
        <div className="flex items-start justify-between">
          <div className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient} text-white shadow-sm`}>
            <Icon className="size-5" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className={`text-[10px] ${status.badge}`}>
              <span className={`ml-1 size-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </Badge>
            <span className={`text-[10px] font-medium ${meta.accent}`}>{type}</span>
          </div>
        </div>

        {/* عنوان */}
        <div>
          <h3 className="line-clamp-2 font-semibold leading-tight">{p.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {p.location || "—"}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {toFa(p.year)}
            </span>
          </div>
        </div>

        {/* آمار + رینگ پیشرفت */}
        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 p-2.5">
          <div className="grid flex-1 grid-cols-3 gap-1 text-center">
            <MiniStat
              icon={<FileText className="size-3" />}
              value={faNum(p._count?.detailBoqs || 0)}
              label="ردیف متره"
            />
            <MiniStat
              icon={<Wallet className="size-3" />}
              value={faNum(p._count?.payments || 0)}
              label="صورت‌وضعیت"
            />
            <MiniStat
              icon={<TrendingUp className="size-3" />}
              value={faMoney(p.cachedTotal || 0).replace(" ریال", "")}
              label="محاسبه"
            />
          </div>
          <CircularProgress value={progress} size={52} strokeWidth={4} />
        </div>

        {/* فوتر: مبلغ پیمان + نوار پیشرفت */}
        <div className="border-t pt-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">مبلغ پیمان</p>
              <p className="text-sm font-bold tabular-nums">{faMoney(p.contractAmount)}</p>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-muted-foreground">اجرا شده</p>
              <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {faMoney(p.cachedExecuted || 0)}
              </p>
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${progressColor(progress)} transition-all duration-500`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* اکشن‌های سریع روی hover */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-gradient-to-t from-amber-50/95 via-amber-50/95 to-transparent p-3 backdrop-blur-sm transition-transform duration-200 group-hover:translate-y-0 dark:from-slate-900/95 dark:via-slate-900/95">
          <Button size="sm" variant="default" className="h-8 gap-1 bg-amber-600 hover:bg-amber-700" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            <Eye className="size-3.5" /> باز کردن
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil className="size-3.5" /> ویرایش
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={(e) => { e.stopPropagation(); onReports(); }}>
            <FileBarChart className="size-3.5" /> گزارش
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-center gap-0.5 text-muted-foreground">{icon}</div>
      <p className="text-xs font-bold tabular-nums">{value}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ProjectRow({
  p,
  onOpen,
  onEdit,
  onReports,
}: {
  p: any;
  onOpen: () => void;
  onEdit: () => void;
  onReports: () => void;
}) {
  const type = detectType(p.name);
  const meta = typeMeta(type);
  const status = statusMeta(p.status);
  const progress = projectProgress(p);
  const Icon = meta.Icon;

  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-amber-50/50 dark:hover:bg-amber-950/10 sm:px-6">
      {/* نوار رنگی وضعیت در سمت راست */}
      <div className={`h-12 w-1 shrink-0 rounded-full ${status.bar}`} />

      {/* آیکن نوع پروژه */}
      <button
        onClick={onOpen}
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient} text-white shadow-sm`}
      >
        <Icon className="size-5" />
      </button>

      {/* اطلاعات اصلی */}
      <button onClick={onOpen} className="min-w-0 flex-1 text-right">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{p.name}</span>
          <Badge variant="secondary" className={`hidden shrink-0 text-[10px] sm:inline-flex ${status.badge}`}>
            {status.label}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="size-3" />
            کد: {toFa(p.code)}
          </span>
          {p.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {p.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {toFa(p.year)}
          </span>
          <span className="hidden items-center gap-1 md:flex">
            <Clock className="size-3" />
            {relativeTime(p.updatedAt)}
          </span>
        </div>
        {/* نوار پیشرفت */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${progressColor(progress)}`} style={{ width: `${progress}%` }} />
          </div>
          <span className="shrink-0 text-[10px] font-semibold tabular-nums">{toFa(progress)}٪</span>
        </div>
      </button>

      {/* آمار: ردیف متره + صورت‌وضعیت */}
      <div className="hidden shrink-0 flex-col items-center gap-0.5 text-center lg:flex">
        <p className="text-xs font-bold tabular-nums">{faNum(p._count?.detailBoqs || 0)}</p>
        <p className="text-[10px] text-muted-foreground">ردیف متره</p>
      </div>
      <div className="hidden shrink-0 flex-col items-center gap-0.5 text-center lg:flex">
        <p className="text-xs font-bold tabular-nums">{faNum(p._count?.payments || 0)}</p>
        <p className="text-[10px] text-muted-foreground">صورت‌وضعیت</p>
      </div>

      {/* مبلغ پیمان */}
      <div className="hidden shrink-0 flex-col items-end gap-0.5 text-left sm:flex">
        <p className="text-sm font-bold tabular-nums">{faMoney(p.contractAmount)}</p>
        <p className="text-[10px] text-muted-foreground">مبلغ پیمان</p>
      </div>

      {/* اجرا شده */}
      <div className="hidden shrink-0 flex-col items-end gap-0.5 text-left md:flex">
        <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
          {faMoney(p.cachedExecuted || 0)}
        </p>
        <p className="text-[10px] text-muted-foreground">اجرا شده</p>
      </div>

      {/* اکشن‌ها */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={onEdit}
          title="ویرایش"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={onReports}
          title="گزارش‌ها"
        >
          <FileBarChart className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 text-amber-600"
          onClick={onOpen}
          title="باز کردن"
        >
          <ArrowUpRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({
  search,
  onClear,
  onCreate,
}: {
  search: string;
  onClear: () => void;
  onCreate: () => void;
}) {
  const hasFilter = !!search;
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
          {hasFilter ? <FolderSearch className="size-10" /> : <FolderPlus className="size-10" />}
        </div>
        <div>
          <p className="text-lg font-semibold">
            {hasFilter ? "پروژه‌ای یافت نشد" : "هنوز پروژه‌ای ثبت نشده"}
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {hasFilter
              ? "با فیلترهای فعلی هیچ پروژه‌ای مطابقت ندارد. می‌توانید فیلترها را پاک کنید یا پروژه جدیدی ایجاد کنید."
              : "برای شروع کار با پلتفرم متره‌یار، اولین پروژه خود را ایجاد کنید. ویزارد ۴ مرحله‌ای شما را راهنمایی می‌کند."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {hasFilter && (
            <Button variant="outline" onClick={onClear}>
              پاک کردن فیلترها
            </Button>
          )}
          <Button onClick={onCreate} className="bg-amber-600 text-white hover:bg-amber-700">
            <Plus className="ml-1.5 size-4" />
            ایجاد پروژه جدید
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
