"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, Search, LayoutGrid, List, Wallet, HardHat, FolderPlus, FolderSearch,
  Building2, ChevronLeft, ClipboardList, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { faMoney, toFa, toJalali } from "@/lib/fa";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PARTY_LABELS_FA, PROJECT_ROLE_LABELS_FA } from "@/lib/design/tokens";
import { ProjectWizard } from "./project/project-wizard";

interface Party { partyType: string; name: string }
interface ProjectItem {
  id: string; name: string; code: string; status: string; year: number;
  location: string | null; contractAmount: number; tenant: string | null;
  parties: Party[]; myRole: string | null; myPartyType: string | null;
  openWorkflows: number; paymentCount: number; updatedAt: string;
}

function relTime(d?: string | null): string {
  if (!d) return "—";
  const t = new Date(d).getTime();
  if (isNaN(t)) return "—";
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days < 1) return "امروز";
  if (days < 7) return `${toFa(days)} روز پیش`;
  return toJalali(d);
}

export function ProjectsView() {
  const { selectProject } = useAppStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | "ACTIVE" | "DRAFT">("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data, isLoading } = useQuery<{ projects: ProjectItem[] }>({
    queryKey: ["projects"],
    queryFn: async () => (await fetch("/api/projects")).json(),
  });
  const all = data?.projects ?? [];

  const projects = useMemo(() => {
    const q = search.trim();
    return all.filter((p) => {
      const m = !q || p.name.includes(q) || p.code.includes(q) || (p.location || "").includes(q);
      const s = statusTab === "all" || p.status === statusTab;
      return m && s;
    });
  }, [all, search, statusTab]);

  const summary = useMemo(() => {
    const totalContract = all.reduce((s, p) => s + (p.contractAmount || 0), 0);
    const active = all.filter((p) => p.status === "ACTIVE").length;
    const open = all.reduce((s, p) => s + (p.openWorkflows || 0), 0);
    return { totalContract, active, open, total: all.length };
  }, [all]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="پروژه‌ها"
        subtitle={`${toFa(projects.length)} از ${toFa(all.length)} پروژه`}
        action={<Button className="gap-1.5" onClick={() => setWizardOpen(true)}><Plus className="size-4" /> پروژه جدید</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="مجموع مبالغ پیمان" value={faMoney(summary.totalContract)} icon={Wallet} loading={isLoading} />
        <MetricCard label="پروژه‌های فعال" value={`${toFa(summary.active)} / ${toFa(summary.total)}`} icon={HardHat} tone="success" loading={isLoading} />
        <MetricCard label="گردش‌کارهای باز" value={toFa(summary.open)} icon={ClipboardList} tone="warning" loading={isLoading} />
        <MetricCard label="کل پروژه‌ها" value={toFa(summary.total)} icon={Building2} tone="info" loading={isLoading} />
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="جستجوی نام، کد یا موقعیت…" value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as never)}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs">همه</TabsTrigger>
            <TabsTrigger value="ACTIVE" className="text-xs">فعال</TabsTrigger>
            <TabsTrigger value="DRAFT" className="text-xs">پیش‌نویس</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex rounded-lg border p-0.5">
          <Button variant={view === "grid" ? "default" : "ghost"} size="sm" onClick={() => setView("grid")} className="h-8 gap-1.5"><LayoutGrid className="size-3.5" /> کارت</Button>
          <Button variant={view === "list" ? "default" : "ghost"} size="sm" onClick={() => setView("list")} className="h-8 gap-1.5"><List className="size-3.5" /> لیست</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState icon={search ? FolderSearch : FolderPlus}
          title={search ? "پروژه‌ای یافت نشد" : "هنوز پروژه‌ای ندارید"}
          description={search ? "با فیلتر فعلی پروژه‌ای مطابقت ندارد." : "برای شروع، یک پروژه جدید بسازید یا فایل تکسا وارد کنید."}
          action={<Button onClick={() => setWizardOpen(true)} className="gap-1.5"><Plus className="size-4" /> ایجاد پروژه جدید</Button>}
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {projects.map((p) => <ProjectCard key={p.id} p={p} onOpen={() => selectProject(p.id)} />)}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="hidden grid-cols-[2fr_1.2fr_1fr_0.8fr_0.8fr_auto] gap-3 border-b bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground md:grid">
            <span>پروژه</span><span>طرفین</span><span>نقش من</span><span className="text-center">گردش باز</span><span>مبلغ پیمان</span><span className="text-center">وضعیت</span>
          </div>
          <div className="divide-y">
            {projects.map((p) => <ProjectRow key={p.id} p={p} onOpen={() => selectProject(p.id)} />)}
          </div>
        </div>
      )}

      <ProjectWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}

function PartyChips({ parties }: { parties: Party[] }) {
  if (!parties.length) return <span className="text-[11px] text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {parties.slice(0, 3).map((p, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          <span className="font-medium text-foreground/70">{PARTY_LABELS_FA[p.partyType] ?? p.partyType}:</span>
          <span className="max-w-[110px] truncate">{p.name}</span>
        </span>
      ))}
    </div>
  );
}

function ProjectCard({ p, onOpen }: { p: ProjectItem; onOpen: () => void }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="size-5" /></div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{p.name}</h3>
            <div className="mt-0.5 text-[11px] text-muted-foreground" dir="ltr">{p.code}</div>
          </div>
        </div>
        <StatusBadge status={p.status} />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <PartyChips parties={p.parties} />
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-2.5 text-center">
          <div><div className="text-sm font-bold tabular-nums">{toFa(p.openWorkflows)}</div><div className="text-[10px] text-muted-foreground">گردش باز</div></div>
          <div><div className="text-sm font-bold tabular-nums">{toFa(p.paymentCount)}</div><div className="text-[10px] text-muted-foreground">صورت‌وضعیت</div></div>
          <div><div className="text-sm font-bold tabular-nums">{toFa(p.year)}</div><div className="text-[10px] text-muted-foreground">سال</div></div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] text-muted-foreground">مبلغ پیمان</div>
            <div className="text-sm font-bold tabular-nums">{faMoney(p.contractAmount)}</div>
          </div>
          {p.myRole && <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{PROJECT_ROLE_LABELS_FA[p.myRole] ?? p.myRole}</span>}
        </div>
      </div>
      <div className="border-t p-3">
        <Button className="w-full gap-1.5" size="sm" onClick={onOpen}>ورود به پروژه <ChevronLeft className="size-4" /></Button>
      </div>
    </div>
  );
}

function ProjectRow({ p, onOpen }: { p: ProjectItem; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="grid w-full grid-cols-1 items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/40 md:grid-cols-[2fr_1.2fr_1fr_0.8fr_0.8fr_auto]">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="size-4" /></div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{p.name}</div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><span dir="ltr">{p.code}</span><span className="hidden items-center gap-1 md:flex"><Clock className="size-3" />{relTime(p.updatedAt)}</span></div>
        </div>
      </div>
      <div className="hidden md:block"><PartyChips parties={p.parties} /></div>
      <div className="hidden text-xs text-muted-foreground md:block">{p.myRole ? (PROJECT_ROLE_LABELS_FA[p.myRole] ?? p.myRole) : "—"}</div>
      <div className="hidden text-center text-sm font-bold tabular-nums md:block">{toFa(p.openWorkflows)}</div>
      <div className="hidden text-sm font-bold tabular-nums md:block">{faMoney(p.contractAmount)}</div>
      <div className="flex items-center justify-between gap-2 md:justify-center">
        <StatusBadge status={p.status} />
        <ChevronLeft className="size-4 text-muted-foreground md:hidden" />
      </div>
    </button>
  );
}
