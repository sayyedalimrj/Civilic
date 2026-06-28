"use client";

import { useQuery } from "@tanstack/react-query";
import {
  FileBarChart,
  FileText,
  Sheet,
  FileCode,
  TrendingUp,
  BookOpen,
  Download,
  Calendar,
  HardHat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/store";
import { faMoney, faNum, toFa, toJalali, progressColor } from "@/lib/fa";

export function ReportsView() {
  const { selectProject } = useAppStore();
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard");
      return r.json();
    },
  });

  const reports = [
    { icon: FileText, title: "برگه مالی استاندارد", desc: "خروجی PDF با سربرگ و آرم سازمان", format: "PDF", color: "amber" },
    { icon: Sheet, title: "صورت‌وضعیت رسمی", desc: "ارسال به دستگاه نظارت", format: "PDF/Word", color: "emerald" },
    { icon: FileBarChart, title: "گزارش متره", desc: "بررسی دقیق ردیف‌ها در Excel", format: "Excel", color: "orange" },
    { icon: FileCode, title: "ساختار شکست کار (WBS)", desc: "ایمپورت در MS Project", format: "XML", color: "slate" },
    { icon: TrendingUp, title: "گزارش تعدیل", desc: "مستندسازی تعدیل پروژه", format: "PDF", color: "amber" },
    { icon: BookOpen, title: "گزارش فصول", desc: "توزیع هزینه بر فصول", format: "PDF", color: "emerald" },
  ];

  const projects = data?.projectStats || [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FileBarChart className="size-6 text-amber-600" />
          گزارشات و خروجی‌ها
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          انتخاب پروژه و تولید خروجی‌های رسمی با سربرگ و امضای سازمان
        </p>
      </div>

      {/* انتخاب پروژه */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">انتخاب پروژه برای گزارش</CardTitle>
          <CardDescription>روی پروژه مورد نظر کلیک کنید تا به ماژول گزارشات پروژه منتقل شوید</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-96">
            <div className="divide-y">
              {projects.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => selectProject(p.id, "export")}
                  className="flex w-full items-center gap-4 px-6 py-3 text-right transition-colors hover:bg-muted/30"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    <HardHat className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{p.name}</div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>کد: {toFa(p.code)}</span>
                      <span>{p.location}</span>
                      <span>سال {toFa(p.year)}</span>
                    </div>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <div className="mb-1 text-[11px] text-muted-foreground">پیشرفت</div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full ${progressColor(p.progress)}`} style={{ width: `${Math.min(100, p.progress)}%` }} />
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">{faMoney(p.executed)}</div>
                    <div className="text-[10px] text-muted-foreground">{faNum(p.paymentCount)} صورت‌وضعیت</div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* انواع خروجی‌ها */}
      <div>
        <h2 className="mb-3 text-base font-semibold">انواع خروجی‌های موجود</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r, i) => {
            const colorMap: Record<string, string> = {
              amber: "from-amber-500 to-orange-600",
              emerald: "from-emerald-500 to-green-600",
              orange: "from-orange-500 to-red-600",
              slate: "from-slate-600 to-slate-800",
            };
            return (
              <Card key={i} className="group overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[r.color]} text-white shadow-sm`}>
                      <r.icon className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{r.format}</Badge>
                  </div>
                  <h3 className="mt-3 font-semibold">{r.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
                  <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5 opacity-70 group-hover:opacity-100" disabled>
                    <Download className="size-3.5" />
                    نیاز به انتخاب پروژه
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* آمار خروجی‌ها */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">آمار خروجی‌های اخیر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <StatBox label="گزارش این ماه" value={faNum(24)} icon={Calendar} />
            <StatBox label="صورت‌وضعیت تولیدی" value={faNum(18)} icon={FileText} />
            <StatBox label="خروجی WBS" value={faNum(7)} icon={FileCode} />
            <StatBox label="گزارش تعدیل" value={faNum(5)} icon={TrendingUp} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ label, value, icon: Icon }: { label: string; value: string; icon: typeof FileText }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
