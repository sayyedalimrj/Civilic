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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, Plus, Pencil, Trash2, Star, Phone, Mail, MapPin, Building2, Package,
} from "lucide-react";
import { faMoney, toFa } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  category: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  rating: number;
  totalOrders: number;
  totalValue: number;
  onTimeRate: number;
  qualityScore: number;
  isActive: boolean;
  notes: string | null;
  _count?: { orders: number };
}

const CATEGORIES = [
  { value: "MATERIAL", label: "مصالح", icon: Package, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40" },
  { value: "EQUIPMENT", label: "تجهیزات", icon: Building2, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-950/40" },
  { value: "LABOR", label: "نیروی انسانی", icon: Users, color: "text-amber-600 bg-amber-100 dark:bg-amber-950/40" },
  { value: "SERVICE", label: "خدمات", icon: Building2, color: "text-purple-600 bg-purple-100 dark:bg-purple-950/40" },
];

const EMPTY_FORM = {
  name: "", category: "MATERIAL", contactPerson: "", phone: "",
  email: "", address: "", taxId: "", notes: "",
};

export function SupplierManagementView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const { data, isLoading } = useQuery<{ suppliers: Supplier[]; summary: any }>({
    queryKey: ["suppliers", filterCategory],
    queryFn: async () => {
      const params = filterCategory !== "ALL" ? `?category=${filterCategory}` : "";
      const r = await fetch(`/api/suppliers${params}`);
      return r.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const url = editId ? `/api/suppliers/${editId}` : "/api/suppliers";
      const r = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("خطا");
      return r.json();
    },
    onSuccess: () => {
      toast({ title: editId ? "به‌روزرسانی شد" : "تأمین‌کننده اضافه شد" });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setDialogOpen(false);
      setEditId(null);
      setForm({ ...EMPTY_FORM });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "حذف شد" });
    },
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      category: s.category,
      contactPerson: s.contactPerson || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      taxId: s.taxId || "",
      notes: s.notes || "",
    });
    setDialogOpen(true);
  };

  const suppliers = data?.suppliers || [];
  const summary = data?.summary;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="size-6 text-amber-600" />
            مدیریت تأمین‌کنندگان
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            پایگاه داده‌ی پیمانکاران، تأمین‌کنندگان مصالح و خدمات
          </p>
        </div>
        <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700" onClick={openAdd}>
          <Plus className="size-4" />
          افزودن تأمین‌کننده
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="کل تأمین‌کنندگان" value={summary ? toFa(summary.total) : "—"} sub={`${summary ? toFa(summary.active) : "—"} فعال`} color="amber" />
        <KPICard label="میانگین امتیاز" value={summary ? toFa(summary.avgRating.toFixed(1)) : "—"} sub="از ۵" color="emerald" />
        <KPICard label="ارزش کل سفارشات" value={summary ? faMoney(suppliers.reduce((s, sup) => s + sup.totalValue, 0)) : "—"} sub={summary ? toFa(suppliers.reduce((s, sup) => s + sup.totalOrders, 0)) + " سفارش" : ""} color="orange" />
        <KPICard label="دسته‌بندی‌ها" value={summary ? toFa(Object.keys(summary.byCategory).length) : "—"} sub="نوع تأمین‌کننده" color="slate" />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory("ALL")}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            filterCategory === "ALL" ? "bg-amber-600 text-white" : "bg-card border hover:bg-muted/50"
          )}
        >
          همه
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilterCategory(c.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
              filterCategory === c.value ? "bg-amber-600 text-white" : "bg-card border hover:bg-muted/50"
            )}
          >
            <c.icon className="size-3" />
            {c.label}
          </button>
        ))}
      </div>

      {/* Supplier Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : !suppliers.length ? (
        <Card><CardContent className="p-12 text-center text-xs text-muted-foreground">
          <Users className="size-10 mx-auto mb-2 text-amber-300" />
          تأمین‌کننده‌ای ثبت نشده
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suppliers.map((s) => {
            const cat = CATEGORIES.find((c) => c.value === s.category) || CATEGORIES[3];
            const CatIcon = cat.icon;
            return (
              <Card key={s.id} className={cn("border-0 shadow-sm hover:shadow-md transition-shadow", !s.isActive && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("size-10 rounded-full flex items-center justify-center shrink-0", cat.color)}>
                      <CatIcon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold truncate">{s.name}</span>
                        {!s.isActive && <Badge variant="outline" className="text-[9px]">غیرفعال</Badge>}
                      </div>
                      <Badge variant="outline" className="text-[9px] mt-0.5">{cat.label}</Badge>
                      {/* Rating stars */}
                      <div className="flex items-center gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "size-3",
                              star <= Math.round(s.rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                        <span className="text-[10px] text-muted-foreground mr-1 tabular-nums">
                          {toFa(s.rating.toFixed(1))}
                        </span>
                      </div>
                      {/* Contact info */}
                      <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                        {s.contactPerson && (
                          <div className="flex items-center gap-1"><Users className="size-2.5" />{s.contactPerson}</div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-1"><Phone className="size-2.5" />{s.phone}</div>
                        )}
                        {s.email && (
                          <div className="flex items-center gap-1"><Mail className="size-2.5" />{s.email}</div>
                        )}
                        {s.address && (
                          <div className="flex items-center gap-1"><MapPin className="size-2.5" />{s.address}</div>
                        )}
                      </div>
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                        <div>
                          <div className="text-[9px] text-muted-foreground">سفارشات</div>
                          <div className="text-xs font-bold tabular-nums">{toFa(s.totalOrders)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-muted-foreground">ارزش کل</div>
                          <div className="text-xs font-bold tabular-nums">{faMoney(s.totalValue)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => openEdit(s)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="size-7 p-0 text-rose-500" onClick={() => { if (confirm("حذف؟")) deleteMutation.mutate(s.id); }}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "ویرایش تأمین‌کننده" : "افزودن تأمین‌کننده جدید"}</DialogTitle>
            <DialogDescription>اطلاعات تماس و دسته‌بندی تأمین‌کننده</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">نام <span className="text-rose-500">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">دسته‌بندی</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">شخص مسئول</Label>
              <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تلفن</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 text-xs" dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ایمیل</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 text-xs" dir="ltr" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">آدرس</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">شناسه ملی / کد اقتصادی</Label>
              <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} className="h-9 text-xs" dir="ltr" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">یادداشت</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[50px] text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" disabled={!form.name || saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
              {saveMutation.isPending ? "ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPICard({ label, value, sub, color }: { label: string; value: string; sub: string; color: "amber" | "emerald" | "rose" | "slate" | "orange" }) {
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
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="text-base font-bold tabular-nums mt-0.5">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}
