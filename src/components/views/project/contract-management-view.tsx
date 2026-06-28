"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Plus, Pencil, Trash2, CheckCircle2, Clock, DollarSign,
  Calendar, Building2, User, AlertCircle,
} from "lucide-react";
import { faMoney, faRial, toFa, toJalali, faPct } from "@/lib/fa";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ContractMilestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  completedDate: string | null;
  amount: number;
  status: string;
  order: number;
}

interface Contract {
  id: string;
  contractNo: string;
  title: string;
  type: string;
  partyName: string;
  partyRole: string;
  contractAmount: number;
  advancePayment: number;
  retentionPct: number;
  signDate: string | null;
  startDate: string | null;
  endDate: string | null;
  durationDays: number;
  status: string;
  notes: string | null;
  milestones: ContractMilestone[];
  _count: { milestones: number };
}

const TYPES = [
  { value: "MAIN", label: "قرارداد اصلی", color: "text-amber-600 bg-amber-100 dark:bg-amber-950/40" },
  { value: "SUBCONTRACT", label: "پیمان فرعی", color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/40" },
  { value: "SUPPLY", label: "تأمین مصالح", color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40" },
  { value: "SERVICE", label: "خدمات", color: "text-purple-600 bg-purple-100 dark:bg-purple-950/40" },
  { value: "CONSULTANCY", label: "مشاوره", color: "text-orange-600 bg-orange-100 dark:bg-orange-950/40" },
];

const PARTY_ROLES = [
  { value: "EMPLOYER", label: "کارفرما" },
  { value: "CONTRACTOR", label: "پیمانکار" },
  { value: "CONSULTANT", label: "مشاور" },
  { value: "SUPPLIER", label: "تأمین‌کننده" },
];

const STATUSES = [
  { value: "DRAFT", label: "پیش‌نویس", color: "bg-amber-100 text-amber-800" },
  { value: "SIGNED", label: "امضا‌شده", color: "bg-cyan-100 text-cyan-800" },
  { value: "ACTIVE", label: "فعال", color: "bg-emerald-100 text-emerald-800" },
  { value: "COMPLETED", label: "تکمیل‌شده", color: "bg-emerald-200 text-emerald-900" },
  { value: "TERMINATED", label: "فسخ‌شده", color: "bg-rose-100 text-rose-800" },
];

const MILESTONE_STATUSES = [
  { value: "PENDING", label: "در انتظار", color: "bg-amber-100 text-amber-800" },
  { value: "COMPLETED", label: "تکمیل‌شده", color: "bg-emerald-100 text-emerald-800" },
  { value: "OVERDUE", label: "تأخیر", color: "bg-rose-100 text-rose-800" },
];

const EMPTY_FORM = {
  contractNo: "", title: "", type: "MAIN", partyName: "", partyRole: "CONTRACTOR",
  contractAmount: 0, advancePayment: 0, retentionPct: 5,
  signDate: "", startDate: "", endDate: "", durationDays: 0, notes: "",
};

export function ContractManagementView() {
  const { selectedProjectId } = useAppStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [milestoneDialog, setMilestoneDialog] = useState<string | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", dueDate: "", amount: 0 });

  const { data, isLoading } = useQuery<{ contracts: Contract[]; summary: any }>({
    queryKey: ["contracts", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}/contracts`);
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const url = editId
        ? `/api/projects/${selectedProjectId}/contracts/${editId}`
        : `/api/projects/${selectedProjectId}/contracts`;
      const r = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          contractAmount: Number(payload.contractAmount) || 0,
          advancePayment: Number(payload.advancePayment) || 0,
          retentionPct: Number(payload.retentionPct) || 5,
          durationDays: Number(payload.durationDays) || 0,
        }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      toast({ title: editId ? "به‌روزرسانی شد" : "قرارداد اضافه شد" });
      qc.invalidateQueries({ queryKey: ["contracts", selectedProjectId] });
      setDialogOpen(false);
      setEditId(null);
      setForm({ ...EMPTY_FORM });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/projects/${selectedProjectId}/contracts/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts", selectedProjectId] });
      toast({ title: "قرارداد حذف شد" });
    },
  });

  const addMilestoneMutation = useMutation({
    mutationFn: async ({ contractId, payload }: { contractId: string; payload: typeof milestoneForm }) => {
      const r = await fetch(`/api/projects/${selectedProjectId}/contracts/${contractId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          amount: Number(payload.amount) || 0,
        }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "milestone اضافه شد" });
      qc.invalidateQueries({ queryKey: ["contracts", selectedProjectId] });
      setMilestoneDialog(null);
      setMilestoneForm({ title: "", description: "", dueDate: "", amount: 0 });
    },
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (c: Contract) => {
    setEditId(c.id);
    setForm({
      contractNo: c.contractNo,
      title: c.title,
      type: c.type,
      partyName: c.partyName,
      partyRole: c.partyRole,
      contractAmount: c.contractAmount,
      advancePayment: c.advancePayment,
      retentionPct: c.retentionPct,
      signDate: c.signDate ? c.signDate.split("T")[0] : "",
      startDate: c.startDate ? c.startDate.split("T")[0] : "",
      endDate: c.endDate ? c.endDate.split("T")[0] : "",
      durationDays: c.durationDays,
      notes: c.notes || "",
    });
    setDialogOpen(true);
  };

  const contracts = data?.contracts || [];
  const summary = data?.summary;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="size-5 text-amber-600" />
            مدیریت قراردادها
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            قراردادهای اصلی، پیمان‌های فرعی، تأمین مصالح و خدمات
          </p>
        </div>
        <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700" onClick={openAdd}>
          <Plus className="size-4" />
          قرارداد جدید
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard icon={FileText} label="کل قراردادها" value={summary ? toFa(summary.total) : "—"} sub={`${summary ? toFa(summary.active) : "—"} فعال`} color="amber" />
        <SummaryCard icon={DollarSign} label="مبلغ کل" value={summary ? faMoney(summary.totalAmount) : "—"} sub="مجموع قراردادها" color="orange" />
        <SummaryCard icon={DollarSign} label="پیش‌پرداخت" value={summary ? faMoney(summary.totalAdvance) : "—"} sub="مجموع پیش‌پرداخت‌ها" color="emerald" />
        <SummaryCard icon={CheckCircle2} label="milestone‌ها" value={summary ? toFa(summary.totalMilestones) : "—"} sub={`${summary ? toFa(summary.completedMilestones) : "—"} تکمیل‌شده`} color="slate" />
        <SummaryCard icon={AlertCircle} label="پیش‌نویس" value={summary ? toFa(summary.draft) : "—"} sub="در انتظار امضا" color="rose" />
      </div>

      {/* Contracts List */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : !contracts.length ? (
        <Card><CardContent className="p-12 text-center text-xs text-muted-foreground">
          <FileText className="size-10 mx-auto mb-2 text-amber-300" />
          قراردادی ثبت نشده
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => {
            const type = TYPES.find((t) => t.value === c.type) || TYPES[0];
            const status = STATUSES.find((s) => s.value === c.status) || STATUSES[0];
            const partyRole = PARTY_ROLES.find((p) => p.value === c.partyRole) || PARTY_ROLES[1];
            const milestonesProgress = c.milestones.length > 0
              ? (c.milestones.filter((m) => m.status === "COMPLETED").length / c.milestones.length) * 100
              : 0;
            const isExpanded = expandedId === c.id;

            return (
              <Card key={c.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start gap-3">
                    <div className={cn("size-10 rounded-full flex items-center justify-center shrink-0", type.color)}>
                      <FileText className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-[10px] text-muted-foreground">{c.contractNo}</span>
                        <span className="text-sm font-bold">{c.title}</span>
                        <Badge className={cn("text-[9px] h-4", type.color)}>{type.label}</Badge>
                        <Badge className={cn("text-[9px] h-4", status.color)}>{status.label}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{partyRole.label}:</span>
                          <span className="font-medium truncate">{c.partyName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="size-3 text-muted-foreground" />
                          <span className="font-medium tabular-nums">{faMoney(c.contractAmount)}</span>
                        </div>
                        {c.startDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3 text-muted-foreground" />
                            <span>{toJalali(c.startDate)}</span>
                          </div>
                        )}
                        {c.durationDays > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="size-3 text-muted-foreground" />
                            <span>{toFa(c.durationDays)} روز</span>
                          </div>
                        )}
                      </div>
                      {/* Milestones progress */}
                      {c.milestones.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-muted-foreground">پیشرفت milestone‌ها</span>
                            <span className="font-medium tabular-nums">{toFa(milestonesProgress.toFixed(0))}٪</span>
                          </div>
                          <Progress value={milestonesProgress} className="h-1.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                        {isExpanded ? "بستن" : "جزئیات"}
                      </Button>
                      <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => openEdit(c)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="size-7 p-0 text-rose-500" onClick={() => { if (confirm("حذف؟")) deleteMutation.mutate(c.id); }}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {/* Financial details */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-2">
                          <div className="text-[9px] text-muted-foreground">مبلغ قرارداد</div>
                          <div className="text-xs font-bold tabular-nums">{faRial(c.contractAmount)}</div>
                        </div>
                        <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 p-2">
                          <div className="text-[9px] text-muted-foreground">پیش‌پرداخت</div>
                          <div className="text-xs font-bold tabular-nums">{faRial(c.advancePayment)}</div>
                        </div>
                        <div className="rounded-md bg-orange-50 dark:bg-orange-950/20 p-2">
                          <div className="text-[9px] text-muted-foreground">سپرده ({toFa(c.retentionPct)}٪)</div>
                          <div className="text-xs font-bold tabular-nums">{faRial(c.contractAmount * c.retentionPct / 100)}</div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-3 gap-3 text-[11px]">
                        <div>
                          <span className="text-muted-foreground">امضا: </span>
                          <span className="font-medium">{c.signDate ? toJalali(c.signDate) : "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">شروع: </span>
                          <span className="font-medium">{c.startDate ? toJalali(c.startDate) : "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">پایان: </span>
                          <span className="font-medium">{c.endDate ? toJalali(c.endDate) : "—"}</span>
                        </div>
                      </div>

                      {c.notes && (
                        <div className="rounded-md bg-muted/30 p-2 text-[11px] italic">{c.notes}</div>
                      )}

                      {/* Milestones */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Milestone‌ها ({toFa(c.milestones.length)})</span>
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={() => { setMilestoneDialog(c.id); setMilestoneForm({ title: "", description: "", dueDate: "", amount: 0 }); }}>
                            <Plus className="size-3" /> افزودن
                          </Button>
                        </div>
                        {c.milestones.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground text-center py-2">milestone‌ای تعریف نشده</div>
                        ) : (
                          <div className="space-y-1">
                            {c.milestones.map((m) => {
                              const ms = MILESTONE_STATUSES.find((s) => s.value === m.status) || MILESTONE_STATUSES[0];
                              const isOverdue = m.status === "PENDING" && new Date(m.dueDate) < new Date();
                              return (
                                <div key={m.id} className="flex items-center gap-2 p-2 rounded-md border text-[11px]">
                                  <div className={cn(
                                    "size-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold",
                                    m.status === "COMPLETED" ? "bg-emerald-500 text-white" : isOverdue ? "bg-rose-500 text-white" : "bg-amber-200 text-amber-800"
                                  )}>
                                    {toFa(m.order)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium">{m.title}</span>
                                    {m.amount > 0 && <span className="text-muted-foreground mr-2 tabular-nums">{faMoney(m.amount)}</span>}
                                  </div>
                                  <span className="text-muted-foreground">{toJalali(m.dueDate)}</span>
                                  <Badge className={cn("text-[8px] h-3.5", ms.color, isOverdue && "bg-rose-200 text-rose-900")}>
                                    {isOverdue && m.status === "PENDING" ? "تأخیر" : ms.label}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contract Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "ویرایش قرارداد" : "قرارداد جدید"}</DialogTitle>
            <DialogDescription>اطلاعات قرارداد، طرف مقابل و شرایط مالی</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">شماره قرارداد</Label>
              <Input value={form.contractNo} onChange={(e) => setForm({ ...form, contractNo: e.target.value })} className="h-9 text-xs font-mono" placeholder="خودکار" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">عنوان <span className="text-rose-500">*</span></Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">نوع قرارداد</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">نقش طرف مقابل</Label>
              <Select value={form.partyRole} onValueChange={(v) => setForm({ ...form, partyRole: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{PARTY_ROLES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">نام طرف مقابل <span className="text-rose-500">*</span></Label>
              <Input value={form.partyName} onChange={(e) => setForm({ ...form, partyName: e.target.value })} className="h-9 text-xs" placeholder="نام شرکت یا شخص" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">مبلغ قرارداد (ریال)</Label>
              <Input type="number" value={form.contractAmount} onChange={(e) => setForm({ ...form, contractAmount: Number(e.target.value) })} className="h-9 text-xs tabular-nums" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">پیش‌پرداخت (ریال)</Label>
              <Input type="number" value={form.advancePayment} onChange={(e) => setForm({ ...form, advancePayment: Number(e.target.value) })} className="h-9 text-xs tabular-nums" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">درصد سپرده ({faPct(0)})</Label>
              <Input type="number" value={form.retentionPct} onChange={(e) => setForm({ ...form, retentionPct: Number(e.target.value) })} className="h-9 text-xs tabular-nums" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">مدت (روز)</Label>
              <Input type="number" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} className="h-9 text-xs tabular-nums" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تاریخ امضا</Label>
              <Input type="date" value={form.signDate} onChange={(e) => setForm({ ...form, signDate: e.target.value })} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تاریخ شروع</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-9 text-xs" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">تاریخ پایان</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="h-9 text-xs" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">یادداشت</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[50px] text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" disabled={!form.title || !form.partyName || saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
              {saveMutation.isPending ? "ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Milestone Dialog */}
      <Dialog open={!!milestoneDialog} onOpenChange={(o) => !o && setMilestoneDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>افزودن Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">عنوان <span className="text-rose-500">*</span></Label>
              <Input value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} className="h-9 text-xs" placeholder="مثلاً تحویل موقت" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">توضیحات</Label>
              <Input value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} className="h-9 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">موعد <span className="text-rose-500">*</span></Label>
                <Input type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">مبلغ (ریال)</Label>
                <Input type="number" value={milestoneForm.amount} onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: Number(e.target.value) })} className="h-9 text-xs tabular-nums" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMilestoneDialog(null)}>انصراف</Button>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" disabled={!milestoneForm.title || !milestoneForm.dueDate || addMilestoneMutation.isPending} onClick={() => milestoneDialog && addMilestoneMutation.mutate({ contractId: milestoneDialog, payload: milestoneForm })}>
              افزودن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, sub, color }: { icon: typeof FileText; label: string; value: string; sub: string; color: "amber" | "emerald" | "rose" | "slate" | "orange" }) {
  const colors = {
    amber: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-700 dark:text-amber-300",
    emerald: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 text-emerald-700 dark:text-emerald-300",
    rose: "from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 text-rose-700 dark:text-rose-300",
    slate: "from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 text-slate-700 dark:text-slate-300",
    orange: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 text-orange-700 dark:text-orange-300",
  };
  return (
    <Card className={cn("border-0 shadow-sm bg-gradient-to-br", colors[color])}>
      <CardContent className="p-3 flex items-center gap-2.5">
        <Icon className="size-4 opacity-60" />
        <div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
          <div className="text-sm font-bold tabular-nums">{value}</div>
          <div className="text-[9px] text-muted-foreground truncate">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );
}
