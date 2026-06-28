"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Shield,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Clock,
  DollarSign,
} from "lucide-react";
import { faMoney, toFa, toJalali } from "@/lib/fa";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Risk {
  id: string;
  title: string;
  description: string | null;
  category: string;
  probability: number;
  impact: number;
  riskScore: number;
  severity: string;
  status: string;
  response: string | null;
  mitigation: string | null;
  contingency: string | null;
  owner: string | null;
  dueDate: string | null;
  estimatedCost: number;
  identifiedAt: string;
  closedAt: string | null;
}

interface Summary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  open: number;
  closed: number;
  totalEstimatedCost: number;
  avgScore: number;
}

const CATEGORIES = [
  { value: "FINANCIAL", label: "مالی" },
  { value: "SCHEDULE", label: "زمان‌بندی" },
  { value: "TECHNICAL", label: "فنی" },
  { value: "CONTRACTUAL", label: "قراردادی" },
  { value: "ENVIRONMENTAL", label: "محیط‌زیستی" },
  { value: "SAFETY", label: "ایمنی" },
];

const RESPONSES = [
  { value: "AVOID", label: "اجتناب" },
  { value: "TRANSFER", label: "انتقال" },
  { value: "MITIGATE", label: "کاهش" },
  { value: "ACCEPT", label: "پذیرش" },
];

const STATUSES = [
  { value: "IDENTIFIED", label: "شناسایی‌شده" },
  { value: "ANALYZED", label: "تحلیل‌شده" },
  { value: "MITIGATING", label: "در حال کاهش" },
  { value: "MONITORING", label: "در حال پایش" },
  { value: "CLOSED", label: "بسته‌شده" },
];

const SEVERITY_META: Record<string, { label: string; color: string; dot: string }> = {
  CRITICAL: { label: "بحرانی", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300", dot: "bg-rose-500" },
  HIGH: { label: "بالا", color: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300", dot: "bg-orange-500" },
  MEDIUM: { label: "متوسط", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300", dot: "bg-amber-500" },
  LOW: { label: "پایین", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300", dot: "bg-emerald-500" },
};

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "FINANCIAL",
  probability: 0.5,
  impact: 0.5,
  response: "MITIGATE",
  mitigation: "",
  contingency: "",
  owner: "",
  dueDate: "",
  estimatedCost: 0,
};

export function RiskManagementView() {
  const { selectedProjectId } = useAppStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data, isLoading } = useQuery<{ risks: Risk[]; summary: Summary; byCategory: Record<string, number> }>({
    queryKey: ["risks", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}/risks`);
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const url = editId
        ? `/api/projects/${selectedProjectId}/risks/${editId}`
        : `/api/projects/${selectedProjectId}/risks`;
      const r = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          probability: Number(payload.probability),
          impact: Number(payload.impact),
          estimatedCost: Number(payload.estimatedCost) || 0,
        }),
      });
      if (!r.ok) throw new Error("خطا در ذخیره");
      return r.json();
    },
    onSuccess: () => {
      toast({ title: editId ? "ریسک به‌روزرسانی شد" : "ریسک جدید اضافه شد" });
      qc.invalidateQueries({ queryKey: ["risks", selectedProjectId] });
      setDialogOpen(false);
      setEditId(null);
      setForm({ ...EMPTY_FORM });
    },
    onError: () => toast({ title: "خطا در ذخیره", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/projects/${selectedProjectId}/risks/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risks", selectedProjectId] });
      toast({ title: "ریسک حذف شد" });
    },
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (risk: Risk) => {
    setEditId(risk.id);
    setForm({
      title: risk.title,
      description: risk.description || "",
      category: risk.category,
      probability: risk.probability,
      impact: risk.impact,
      response: risk.response || "MITIGATE",
      mitigation: risk.mitigation || "",
      contingency: risk.contingency || "",
      owner: risk.owner || "",
      dueDate: risk.dueDate ? risk.dueDate.split("T")[0] : "",
      estimatedCost: risk.estimatedCost,
    });
    setDialogOpen(true);
  };

  const summary = data?.summary;
  const risks = data?.risks || [];
  const liveScore = form.probability * form.impact;
  const liveSeverity =
    liveScore >= 0.6 ? "CRITICAL" : liveScore >= 0.4 ? "HIGH" : liveScore >= 0.2 ? "MEDIUM" : "LOW";

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield className="size-5 text-amber-600" />
            مدیریت ریسک پروژه
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            شناسایی، تحلیل و پاسخ به ریسک‌های پروژه
          </p>
        </div>
        <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700" onClick={openAdd}>
          <Plus className="size-4" />
          افزودن ریسک
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={AlertOctagon}
          label="کل ریسک‌ها"
          value={summary ? toFa(summary.total) : "—"}
          sub={`${summary ? toFa(summary.open) : "—"} باز • ${summary ? toFa(summary.closed) : "—"} بسته`}
          color="amber"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="بحرانی + بالا"
          value={summary ? toFa(summary.critical + summary.high) : "—"}
          sub={`${summary ? toFa(summary.critical) : "—"} بحرانی • ${summary ? toFa(summary.high) : "—"} بالا`}
          color="rose"
        />
        <SummaryCard
          icon={TrendingUp}
          label="میانگین امتیاز ریسک"
          value={summary ? toFa((summary.avgScore * 100).toFixed(0)) + "٪" : "—"}
          sub="probability × impact"
          color="orange"
        />
        <SummaryCard
          icon={DollarSign}
          label="هزینه‌ی تخمینی کل"
          value={summary ? faMoney(summary.totalEstimatedCost) : "—"}
          sub="مجموع هزینه‌ی رخداد ریسک‌ها"
          color="slate"
        />
      </div>

      {/* Severity Distribution */}
      {summary && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600" />
              توزیع ریسک‌ها بر اساس شدت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => {
                const meta = SEVERITY_META[sev];
                const count = summary[
                  sev.toLowerCase() as "critical" | "high" | "medium" | "low"
                ];
                const percent = summary.total > 0 ? (count / summary.total) * 100 : 0;
                return (
                  <div key={sev} className={cn("rounded-lg border p-3", meta.color)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium">{meta.label}</span>
                      <span className="text-lg font-bold tabular-nums">{toFa(count)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                      <div className={cn("h-full rounded-full", meta.dot)} style={{ width: `${percent}%` }} />
                    </div>
                    <div className="text-[9px] mt-1 opacity-70">{toFa(percent.toFixed(0))}٪ از کل</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Matrix */}
      {risks.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertOctagon className="size-4 text-orange-600" />
              ماتریس ریسک (احتمال × تأثیر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-1 text-[10px]">
              <div></div>
              <div className="text-center font-medium">ناچیز (۰.۲)</div>
              <div className="text-center font-medium">کم (۰.۴)</div>
              <div className="text-center font-medium">متوسط (۰.۶)</div>
              <div className="text-center font-medium">زیاد (۰.۸)</div>
              <div className="text-center font-medium">حتمی (۱.۰)</div>

              {[1.0, 0.8, 0.6, 0.4, 0.2].map((impact) => (
                <>
                  <div key={`label-${impact}`} className="text-left font-medium flex items-center">
                    {toFa(impact)}
                  </div>
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((prob) => {
                    const cellRisks = risks.filter(
                      (r) =>
                        Math.abs(r.probability - prob) < 0.15 &&
                        Math.abs(r.impact - impact) < 0.15
                    );
                    const score = prob * impact;
                    const bg =
                      score >= 0.6 ? "bg-rose-200 dark:bg-rose-900/50" :
                      score >= 0.4 ? "bg-orange-200 dark:bg-orange-900/50" :
                      score >= 0.2 ? "bg-amber-200 dark:bg-amber-900/50" :
                      "bg-emerald-200 dark:bg-emerald-900/50";
                    return (
                      <div
                        key={`${prob}-${impact}`}
                        className={cn("h-12 rounded border flex items-center justify-center font-bold", bg)}
                        title={`${cellRisks.length} ریسک`}
                      >
                        {cellRisks.length > 0 ? toFa(cellRisks.length) : ""}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="size-4 text-amber-600" />
            لیست ریسک‌ها ({toFa(risks.length)})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : !risks.length ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Shield className="size-10 mx-auto mb-2 text-amber-300" />
              ریسکی ثبت نشده
              <br />
              <span className="text-[11px]">روی «افزودن ریسک» بزنید</span>
            </div>
          ) : (
            <div className="divide-y">
              {risks.map((risk) => {
                const meta = SEVERITY_META[risk.severity] || SEVERITY_META.LOW;
                const cat = CATEGORIES.find((c) => c.value === risk.category);
                const status = STATUSES.find((s) => s.value === risk.status);
                return (
                  <div key={risk.id} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn("size-3 rounded-full mt-1.5 shrink-0", meta.dot)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-bold">{risk.title}</span>
                          <Badge className={cn("text-[9px] h-4", meta.color)}>
                            {meta.label}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] h-4">
                            {cat?.label || risk.category}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] h-4">
                            {status?.label || risk.status}
                          </Badge>
                          {risk.estimatedCost > 0 && (
                            <Badge variant="outline" className="text-[9px] h-4 text-rose-600">
                              هزینه: {faMoney(risk.estimatedCost)}
                            </Badge>
                          )}
                        </div>
                        {risk.description && (
                          <p className="text-[11px] text-muted-foreground mb-1">
                            {risk.description}
                          </p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                          <div>
                            <span className="opacity-70">احتمال:</span>{" "}
                            <span className="font-medium tabular-nums">{toFa((risk.probability * 100).toFixed(0))}٪</span>
                          </div>
                          <div>
                            <span className="opacity-70">تأثیر:</span>{" "}
                            <span className="font-medium tabular-nums">{toFa((risk.impact * 100).toFixed(0))}٪</span>
                          </div>
                          <div>
                            <span className="opacity-70">امتیاز:</span>{" "}
                            <span className="font-bold tabular-nums">{toFa((risk.riskScore * 100).toFixed(0))}٪</span>
                          </div>
                          <div>
                            <span className="opacity-70">مسئول:</span>{" "}
                            <span className="font-medium">{risk.owner || "—"}</span>
                          </div>
                        </div>
                        {risk.mitigation && (
                          <div className="mt-1.5 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 p-2 text-[11px]">
                            <span className="font-medium text-emerald-700 dark:text-emerald-300">اقدام کاهش:</span>{" "}
                            <span className="text-muted-foreground">{risk.mitigation}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Clock className="size-2.5" />
                            {toJalali(risk.identifiedAt)}
                          </span>
                          {risk.dueDate && (
                            <span className="text-amber-600">
                              موعد: {toJalali(risk.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => openEdit(risk)}>
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-rose-500"
                          onClick={() => {
                            if (confirm("حذف ریسک؟")) deleteMutation.mutate(risk.id);
                          }}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "ویرایش ریسک" : "افزودن ریسک جدید"}</DialogTitle>
            <DialogDescription>
              شناسایی و تحلیل ریسک — امتیاز ریسک به‌صورت خودکار محاسبه می‌شود
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">عنوان ریسک <span className="text-rose-500">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثلاً تأخیر در تأمین مصالات"
                className="h-9 text-xs"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">توضیحات</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="شرح کامل ریسک..."
                className="min-h-[60px] text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">دسته‌بندی</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">پاسخ به ریسک</Label>
              <Select value={form.response} onValueChange={(v) => setForm({ ...form, response: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESPONSES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span>احتمال رخداد</span>
                <Badge variant="outline" className="text-[10px]">{toFa((form.probability * 100).toFixed(0))}٪</Badge>
              </Label>
              <Input
                type="number"
                min={0} max={1} step={0.1}
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                className="h-9 text-xs tabular-nums"
              />
              <input
                type="range" min={0} max={1} step={0.1}
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                className="w-full accent-amber-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span>تأثیر</span>
                <Badge variant="outline" className="text-[10px]">{toFa((form.impact * 100).toFixed(0))}٪</Badge>
              </Label>
              <Input
                type="number"
                min={0} max={1} step={0.1}
                value={form.impact}
                onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
                className="h-9 text-xs tabular-nums"
              />
              <input
                type="range" min={0} max={1} step={0.1}
                value={form.impact}
                onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
                className="w-full accent-amber-600"
              />
            </div>
            {/* Live risk score */}
            <div className="col-span-2 rounded-md bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-3 border-2 border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-muted-foreground">امتیاز ریسک (احتمال × تأثیر)</div>
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                    {toFa((liveScore * 100).toFixed(0))}٪
                  </div>
                </div>
                <Badge className={SEVERITY_META[liveSeverity].color}>
                  {SEVERITY_META[liveSeverity].label}
                </Badge>
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">اقدامات کاهش (Mitigation)</Label>
              <Textarea
                value={form.mitigation}
                onChange={(e) => setForm({ ...form, mitigation: e.target.value })}
                placeholder="اقداماتی برای کاهش احتمال یا تأثیر ریسک..."
                className="min-h-[50px] text-xs"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">طرح بی‌انبوه (Contingency)</Label>
              <Input
                value={form.contingency}
                onChange={(e) => setForm({ ...form, contingency: e.target.value })}
                placeholder="اقدام در صورت رخداد ریسک..."
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">مسئول ریسک</Label>
              <Input
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                placeholder="نام مسئول"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">موعد رسیدگی</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">هزینه‌ی تخمینی رخداد (ریال)</Label>
              <Input
                type="number"
                value={form.estimatedCost}
                onChange={(e) => setForm({ ...form, estimatedCost: Number(e.target.value) })}
                className="h-9 text-xs tabular-nums"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              انصراف
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!form.title || saveMutation.isPending}
              onClick={() => saveMutation.mutate(form)}
            >
              {saveMutation.isPending ? "در حال ذخیره..." : editId ? "به‌روزرسانی" : "ذخیره ریسک"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  sub: string;
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
        <div className="text-lg font-bold tabular-nums">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</div>
      </CardContent>
    </Card>
  );
}
