"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, FileText, ListTree, Receipt, TrendingUp,
  MessageSquare, Download,
} from "lucide-react";
import { useAppStore, type ProjectTab } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toFa, faMoney } from "@/lib/fa";

import { OverviewView } from "./overview-view";
import { DetailBoqView } from "./detail-boq-view";
import { SummaryBoqView } from "./summary-boq-view";
import { FinancialSheetView } from "./financial-sheet-view";
import { PaymentsView } from "./payments-view";
import { AdjustmentView } from "./adjustment-view";
import { ReportsView } from "./reports-view";

const TABS: { id: ProjectTab; label: string; icon: typeof FileText }[] = [
  { id: "overview", label: "پیشخوان", icon: LayoutDashboard },
  { id: "documents", label: "اسناد و مکاتبات", icon: FileText },
  { id: "metering", label: "متره", icon: ListTree },
  { id: "payment", label: "صورت‌وضعیت", icon: Receipt },
  { id: "adjustment", label: "تعدیل", icon: TrendingUp },
  { id: "discussion", label: "گفتگو", icon: MessageSquare },
  { id: "export", label: "گزارش و خروجی", icon: Download },
];

export function ProjectDetail() {
  const { selectedProjectId, selectedProjectTab, setProjectTab, currentUser } = useAppStore();

  const { data } = useQuery<{ project: any }>({
    queryKey: ["project", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}`);
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  const project = data?.project;

  // Role labels for identity bar
  const PARTY_LABELS: Record<string, string> = {
    EMPLOYER: "کارفرما",
    CONSULTANT: "مشاور",
    CONTRACTOR: "پیمانکار",
  };
  const ROLE_LABELS: Record<string, string> = {
    RESIDENT_ENGINEER: "ناظر مقیم",
    CONSULTANT_APPROVER: "تأییدکننده مشاور",
    CONTRACTOR_PM: "مدیر پروژه پیمانکار",
    EMPLOYER_APPROVER: "مقام تأیید کارفرما",
  };

  return (
    <div className="flex h-full flex-col">
      {/* Project identity bar */}
      <div className="border-b bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold">{project?.name || "پروژه"}</h1>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
              {project?.code && <span className="font-mono">{project.code}</span>}
              {project?.contractAmount != null && <span>• {faMoney(project.contractAmount)}</span>}
              <Badge variant="outline" className="text-[9px] h-4">
                {project?.status === "ACTIVE" ? "فعال" : "پیش‌نویس"}
              </Badge>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground text-left">
            <div>شما: <span className="font-medium text-foreground">{currentUser.userName}</span></div>
            <div>{PARTY_LABELS[currentUser.partyType]} / {ROLE_LABELS[currentUser.role] || currentUser.role}</div>
            {currentUser.canApprove && <Badge className="text-[8px] h-3.5 bg-emerald-100 text-emerald-800">مجاز به تأیید</Badge>}
          </div>
        </div>
        {/* Parties */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span>کارفرما: <span className="font-medium text-foreground">دانشگاه خاتم</span></span>
          <span>•</span>
          <span>مشاور: <span className="font-medium text-foreground">مهندسین مشاور شارستان</span></span>
          <span>•</span>
          <span>پیمانکار: <span className="font-medium text-foreground">شرکت سیوان تدبیر تجارت</span></span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-2">
          {TABS.map((tab) => {
            const active = selectedProjectTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={active ? "default" : "ghost"}
                size="sm"
                onClick={() => setProjectTab(tab.id)}
                className={cn(
                  "h-8 shrink-0 gap-1.5 text-xs",
                  active && "bg-amber-600 text-primary-foreground hover:bg-amber-700"
                )}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedProjectTab === "overview" && <OverviewView />}
        {selectedProjectTab === "documents" && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <FileText className="size-8 mx-auto mb-2 text-muted-foreground/40" />
            اسناد و مکاتبات پروژه
          </div>
        )}
        {selectedProjectTab === "metering" && (
          <MeteringStep />
        )}
        {selectedProjectTab === "payment" && <PaymentsView />}
        {selectedProjectTab === "adjustment" && <AdjustmentView />}
        {selectedProjectTab === "discussion" && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <MessageSquare className="size-8 mx-auto mb-2 text-muted-foreground/40" />
            گفتگوی پروژه — کانال‌های عمومی، فنی، صورت‌وضعیت و کارگاه
          </div>
        )}
        {selectedProjectTab === "export" && <ReportsView />}
      </div>
    </div>
  );
}

function MeteringStep() {
  const [showSummary, setShowSummary] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4">
        <div>
          <h2 className="text-base font-bold">متره و صورتجلسات</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">ثبت احجام و مقادیر — خلاصه متره خودکار</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowSummary(!showSummary)}>
          {showSummary ? "ریزمتره" : "خلاصه متره"}
        </Button>
      </div>
      {showSummary ? <SummaryBoqView /> : <DetailBoqView />}
    </div>
  );
}
