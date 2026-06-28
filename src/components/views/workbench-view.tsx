"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FolderTree, MessageSquare, FileText, AlertCircle, ArrowLeft,
  ClipboardCheck, CheckCircle2, ShieldCheck, Receipt, Bell, ChevronLeft,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toFa, faMoney, toJalali } from "@/lib/fa";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

interface WorkbenchData {
  isPlatformAdmin: boolean;
  partyTypes: string[];
  counts: { pending: number; inReview: number; unreadMessages: number; letters: number; alerts: number };
  pendingPayments: { id: string; projectId: string; projectName: string; periodNo: number; status: string; amount: number }[];
  inReview: { id: string; projectId: string; projectName: string; periodNo: number; status: string; amount: number }[];
  alerts: { id: string; title: string; message: string; severity: string; projectId: string | null }[];
  letters: { id: string; letterNo: string | null; subject: string; status: string; projectId: string | null; date: string | null }[];
  messages: { id: string; body: string; senderName: string; channel: string; projectId: string; createdAt: string }[];
  recentProjects: { id: string; name: string; code: string; status: string; contractAmount: number; role: string | null; partyType: string | null }[];
}

export function WorkbenchView() {
  const { setView, selectProject } = useAppStore();
  const { data, isLoading } = useQuery<WorkbenchData>({
    queryKey: ["workbench"],
    queryFn: async () => (await fetch("/api/workbench")).json(),
  });

  const primary = primaryCta(data);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="کارتابل من"
        subtitle="کارهای مهم، پیام‌ها و پروژه‌های شما در یک نگاه"
        action={
          primary.href ? (
            <Button asChild size="lg" className="h-10 gap-2"><Link href={primary.href}>{primary.icon}{primary.label}</Link></Button>
          ) : (
            <Button size="lg" className="h-10 gap-2" onClick={primary.onClick}>{primary.icon}{primary.label}</Button>
          )
        }
      />

      {/* metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="اقدامات منتظر من" value={toFa(data?.counts.pending ?? 0)} icon={ClipboardCheck} tone="warning" loading={isLoading} />
        <MetricCard label="در حال بررسی" value={toFa(data?.counts.inReview ?? 0)} icon={Receipt} tone="info" loading={isLoading} />
        <MetricCard label="پیام‌های خوانده‌نشده" value={toFa(data?.counts.unreadMessages ?? 0)} icon={MessageSquare} tone="default" loading={isLoading} />
        <MetricCard label="هشدارهای مهم" value={toFa(data?.counts.alerts ?? 0)} icon={Bell} tone="danger" loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* main column */}
        <div className="space-y-5 lg:col-span-2">
          <SectionCard title="اقدامات منتظر من" icon={<ClipboardCheck className="size-4" />} bodyClassName="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (data?.pendingPayments.length ?? 0) === 0 ? (
              <div className="p-4"><EmptyState icon={CheckCircle2} title="اقدام منتظری ندارید" description="همه‌ی صورت‌وضعیت‌های مرتبط با شما رسیدگی شده‌اند." /></div>
            ) : (
              <ul className="divide-y">
                {data!.pendingPayments.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => selectProject(p.projectId, "payment")} className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/40">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Receipt className="size-4" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">صورت‌وضعیت شماره {toFa(p.periodNo)} — {p.projectName}</div>
                        <div className="text-[11px] text-muted-foreground">{faMoney(p.amount)}</div>
                      </div>
                      <StatusBadge status={p.status} kind="payment" />
                      <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="صورت‌وضعیت‌های منتظر بررسی" icon={<Receipt className="size-4" />} bodyClassName="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : (data?.inReview.length ?? 0) === 0 ? (
              <div className="p-4"><EmptyState title="موردی برای بررسی نیست" /></div>
            ) : (
              <ul className="divide-y">
                {data!.inReview.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => selectProject(p.projectId, "payment")} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-start hover:bg-muted/40">
                      <span className="min-w-0 truncate text-sm">شماره {toFa(p.periodNo)} — {p.projectName}</span>
                      <StatusBadge status={p.status} kind="payment" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* side column */}
        <div className="space-y-5">
          <SectionCard title="پیام‌های خوانده‌نشده" icon={<MessageSquare className="size-4" />} bodyClassName="p-0"
            action={<Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setView("messages")}>همه <ArrowLeft className="size-3" /></Button>}>
            {isLoading ? (
              <div className="space-y-2 p-4">{[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (data?.messages.length ?? 0) === 0 ? (
              <div className="p-4"><EmptyState icon={MessageSquare} title="پیام خوانده‌نشده‌ای ندارید" /></div>
            ) : (
              <ul className="divide-y">
                {data!.messages.map((m) => (
                  <li key={m.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{m.senderName}</span>
                      <span className="text-[10px] text-muted-foreground">{m.channel}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="مکاتبات ارجاع‌شده" icon={<FileText className="size-4" />} bodyClassName="p-0">
            {isLoading ? (
              <div className="space-y-2 p-4">{[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (data?.letters.length ?? 0) === 0 ? (
              <div className="p-4"><EmptyState icon={FileText} title="مکاتبه‌ای به شما ارجاع نشده است" /></div>
            ) : (
              <ul className="divide-y">
                {data!.letters.map((l) => (
                  <li key={l.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium">{l.subject}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{l.letterNo && <span dir="ltr">{l.letterNo}</span>} {l.date && <span> • {toJalali(l.date)}</span>}</div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      {/* bottom */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard title="پروژه‌های اخیر" icon={<FolderTree className="size-4" />} bodyClassName="p-0"
          action={<Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setView("projects")}>همه <ArrowLeft className="size-3" /></Button>}>
          {isLoading ? (
            <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (data?.recentProjects.length ?? 0) === 0 ? (
            <div className="p-4"><EmptyState icon={FolderTree} title="هنوز پروژه‌ای ندارید" description="برای شروع، یک پروژه ایجاد کنید یا فایل تکسا وارد کنید." action={<Button size="sm" onClick={() => setView("projects")}>پروژه‌ها</Button>} /></div>
          ) : (
            <ul className="divide-y">
              {data!.recentProjects.map((p) => (
                <li key={p.id}>
                  <button onClick={() => selectProject(p.id)} className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-muted/40">
                    <span className={cn("size-2 shrink-0 rounded-full", p.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-400")} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground"><span dir="ltr">{p.code}</span> • {faMoney(p.contractAmount)}</div>
                    </div>
                    {p.partyType && <StatusBadge label={partyFa(p.partyType)} tone="info" />}
                    <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="هشدارهای مهم" icon={<AlertCircle className="size-4" />} bodyClassName="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (data?.alerts.length ?? 0) === 0 ? (
            <div className="p-4"><EmptyState icon={CheckCircle2} title="هشداری وجود ندارد" /></div>
          ) : (
            <ul className="divide-y">
              {data!.alerts.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", a.severity === "WARNING" ? "bg-amber-50 text-amber-600" : a.severity === "CRITICAL" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600")}>
                    <AlertCircle className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{a.title}</div>
                    <p className="truncate text-[11px] text-muted-foreground">{a.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function partyFa(pt: string): string {
  return pt === "EMPLOYER" ? "کارفرما" : pt === "CONSULTANT" ? "مشاور" : pt === "CONTRACTOR" ? "پیمانکار" : pt;
}

function primaryCta(data?: WorkbenchData): { label: string; icon: React.ReactNode; href?: string; onClick?: () => void } {
  if (data?.isPlatformAdmin) return { label: "ورود به مدیریت سامانه", icon: <ShieldCheck className="size-5" />, href: "/admin" };
  const pt = data?.partyTypes ?? [];
  if (pt.includes("CONTRACTOR")) return { label: "ایجاد صورت‌وضعیت جدید", icon: <Receipt className="size-5" />, onClick: () => useAppStore.getState().setView("projects") };
  if (pt.includes("CONSULTANT")) return { label: "بررسی موارد ارجاع‌شده", icon: <ClipboardCheck className="size-5" />, onClick: () => useAppStore.getState().setView("projects") };
  if (pt.includes("EMPLOYER")) return { label: "تایید موارد منتظر کارفرما", icon: <CheckCircle2 className="size-5" />, onClick: () => useAppStore.getState().setView("projects") };
  return { label: "باز کردن پروژه‌ها", icon: <FolderTree className="size-5" />, onClick: () => useAppStore.getState().setView("projects") };
}
