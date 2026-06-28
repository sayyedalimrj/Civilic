"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Inbox, UploadCloud, FolderTree, FileText, MessageSquare,
  AlertCircle, ArrowLeft, Clock, CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toFa, faMoney, toJalali } from "@/lib/fa";
import { cn } from "@/lib/utils";

export function WorkbenchView() {
  const { setView, selectProject, currentUser } = useAppStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard");
      return r.json();
    },
  });

  const { stats, projectStats } = data || {};

  // Role-based items
  const PARTY_LABELS: Record<string, string> = {
    EMPLOYER: "کارفرما",
    CONSULTANT: "مشاور",
    CONTRACTOR: "پیمانکار",
  };

  const ROLE_LABELS: Record<string, string> = {
    RESIDENT_ENGINEER: "ناظر مقیم",
    CONSULTANT_REVIEWER: "دفتر فنی مشاور",
    CONSULTANT_APPROVER: "تأییدکننده مشاور",
    CONTRACTOR_PM: "مدیر پروژه پیمانکار",
    SITE_MANAGER: "رئیس کارگاه",
    QUANTITY_SURVEYOR: "مترور",
    BILLING_EXPERT: "کارشناس صورت‌وضعیت",
    EMPLOYER_PM: "مدیر پروژه کارفرما",
    EMPLOYER_REVIEWER: "رسیدگی‌کننده کارفرما",
    EMPLOYER_APPROVER: "مقام تأیید کارفرما",
    PAYMENT_OFFICER: "مسئول پرداخت",
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-5xl">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold mb-0.5">کارتابل من</h1>
        <p className="text-sm text-muted-foreground">
          {currentUser.userName} — {PARTY_LABELS[currentUser.partyType]} / {ROLE_LABELS[currentUser.role] || currentUser.role}
        </p>
      </div>

      {/* Primary action */}
      <div className="flex flex-wrap gap-3">
        <Button size="lg" className="h-11 gap-2 bg-amber-600 hover:bg-amber-700" onClick={() => setView("projects")}>
          <FolderTree className="size-5" />
          باز کردن پروژه
        </Button>
        <Button size="lg" variant="outline" className="h-11 gap-2" onClick={() => setView("settings")}>
          <UploadCloud className="size-5" />
          وارد کردن فایل تکسا
        </Button>
      </div>

      {/* 4 KPIs max */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)
        ) : (
          <>
            <KPICard label="پروژه‌های فعال" value={toFa(stats?.activeProjects || 0)} />
            <KPICard label="صورت‌وضعیت‌ها" value={toFa(stats?.totalPayments || 0)} />
            <KPICard label="مبلغ کل پیمان" value={faMoney(stats?.totalContract || 0)} />
            <KPICard
              label="اقدامات فوری"
              value={toFa(2)}
              highlight
            />
          </>
        )}
      </div>

      {/* Action items — role-based */}
      <div>
        <h2 className="text-sm font-bold mb-3">اقدام‌های فوری من</h2>
        <div className="space-y-2">
          <ActionItem
            icon={Clock}
            title="صورت‌وضعیت دوره ۲ — منتظر بررسی مشاور"
            desc="پروژه متروی تهران خط ۷ — ارسال‌شده توسط پیمانکار"
            badge="در انتظار"
            badgeColor="bg-amber-100 text-amber-800"
            onClick={() => selectProject("proj-metro7", "payment")}
          />
          <ActionItem
            icon={MessageSquare}
            title="پیام جدید در کانال پروژه پل روگذار"
            desc="احمد میرزایی: ریزمتره فصل ۲ به‌روزرسانی شد"
            badge="جدید"
            badgeColor="bg-emerald-100 text-emerald-800"
            onClick={() => selectProject("proj-bridge", "discussion")}
          />
          <ActionItem
            icon={FileText}
            title="نامه رسمی از کارفرما"
            desc="درخواست توضیح درباره تأخیر عملیات خاکبرداری"
            badge="مکاتبه"
            badgeColor="bg-purple-100 text-purple-800"
            onClick={() => selectProject("proj-metro7", "documents")}
          />
        </div>
      </div>

      {/* Recent projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">آخرین پروژه‌ها</h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setView("projects")}>
            همه <ArrowLeft className="size-3" />
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : (
          <div className="space-y-2">
            {(projectStats || []).slice(0, 5).map((p: any) => (
              <button
                key={p.id}
                onClick={() => selectProject(p.id)}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-right transition-colors hover:bg-muted/30"
              >
                <div className={cn("size-2 rounded-full shrink-0", p.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-400")} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.code} • {faMoney(p.contractAmount)}</div>
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">{p.status === "ACTIVE" ? "فعال" : "پیش‌نویس"}</Badge>
                <ArrowLeft className="size-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card className={cn("border shadow-sm", highlight && "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20")}>
      <CardContent className="p-4">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className={cn("text-lg font-bold tabular-nums mt-1", highlight && "text-amber-700 dark:text-amber-300")}>{value}</div>
      </CardContent>
    </Card>
  );
}

function ActionItem({
  icon: Icon, title, desc, badge, badgeColor, onClick,
}: {
  icon: typeof Clock; title: string; desc: string; badge: string; badgeColor: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border p-3 text-right transition-colors hover:bg-muted/30"
    >
      <div className="size-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
        <Icon className="size-4 text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-[11px] text-muted-foreground truncate">{desc}</div>
      </div>
      <Badge className={cn("text-[9px] shrink-0", badgeColor)}>{badge}</Badge>
      <ArrowLeft className="size-4 text-muted-foreground shrink-0" />
    </button>
  );
}
