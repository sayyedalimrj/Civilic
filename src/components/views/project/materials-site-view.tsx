"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Package,
  Trash2,
  Pencil,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { faMoney, faRial, toFa } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";

interface MaterialAtSite {
  id: string;
  code: string;
  description: string;
  unit: string;
  purchasedQuantity: number;
  previousExecuted: number;
  currentExecuted: number;
  remainingQuantity: number;
  invoiceNo: string | null;
  supplier: string | null;
  purchaseDate: string | null;
  unitPrice: number;
  totalCost: number;
  notes: string | null;
}

interface Summary {
  count: number;
  totalCost: number;
  totalRemaining: number;
}

const EMPTY_FORM = {
  code: "",
  description: "",
  unit: "تن",
  purchasedQuantity: 0,
  previousExecuted: 0,
  currentExecuted: 0,
  invoiceNo: "",
  supplier: "",
  purchaseDate: "",
  unitPrice: 0,
  notes: "",
};

export function MaterialsSiteView() {
  const { selectedProjectId } = useAppStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const { data, isLoading } = useQuery<{
    materials: MaterialAtSite[];
    summary: Summary;
  }>({
    queryKey: ["materials-site", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(
        `/api/projects/${selectedProjectId}/materials-at-site`
      );
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const url = editId
        ? `/api/projects/${selectedProjectId}/materials-at-site/${editId}`
        : `/api/projects/${selectedProjectId}/materials-at-site`;
      const r = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          purchasedQuantity: Number(payload.purchasedQuantity) || 0,
          previousExecuted: Number(payload.previousExecuted) || 0,
          currentExecuted: Number(payload.currentExecuted) || 0,
          unitPrice: Number(payload.unitPrice) || 0,
        }),
      });
      if (!r.ok) throw new Error("خطا در ذخیره");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["materials-site", selectedProjectId],
      });
      toast({ title: editId ? "مصالح به‌روزرسانی شد" : "مصالح اضافه شد" });
      setDialogOpen(false);
      setEditId(null);
      setForm({ ...EMPTY_FORM });
    },
    onError: () =>
      toast({ title: "خطا در ذخیره", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(
        `/api/projects/${selectedProjectId}/materials-at-site/${id}`,
        { method: "DELETE" }
      );
      if (!r.ok) throw new Error("خطا");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["materials-site", selectedProjectId],
      });
      toast({ title: "مصالح حذف شد" });
    },
  });

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (m: MaterialAtSite) => {
    setEditId(m.id);
    setForm({
      code: m.code,
      description: m.description,
      unit: m.unit,
      purchasedQuantity: m.purchasedQuantity,
      previousExecuted: m.previousExecuted,
      currentExecuted: m.currentExecuted,
      invoiceNo: m.invoiceNo || "",
      supplier: m.supplier || "",
      purchaseDate: m.purchaseDate ? m.purchaseDate.split("T")[0] : "",
      unitPrice: m.unitPrice,
      notes: m.notes || "",
    });
    setDialogOpen(true);
  };

  const summary = data?.summary;
  const materials = data?.materials || [];

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package className="size-5 text-amber-600" />
            مصالح پای کار
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            پیگیری مصالحی که خریداری شده اما هنوز اجرا نشده — حیاتی برای تعدیل
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700"
          onClick={openAdd}
        >
          <Plus className="size-4" />
          افزودن مصالح
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-muted-foreground">تعداد اقلام</div>
                <div className="text-xl font-bold mt-1">
                  {summary ? toFa(summary.count) : "—"}
                </div>
              </div>
              <div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Package className="size-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-950/30 dark:to-rose-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-muted-foreground">ارزش کل خرید</div>
                <div className="text-xl font-bold mt-1">
                  {summary ? faMoney(summary.totalCost) : "—"}
                </div>
              </div>
              <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                <TrendingDown className="size-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-muted-foreground">مجموع باقی‌مانده</div>
                <div className="text-xl font-bold mt-1">
                  {summary ? `${toFa(Math.round(summary.totalRemaining))} واحد` : "—"}
                </div>
              </div>
              <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <strong>نکته مهم:</strong> مصالح پای کار باید از صورت‌وضعیت قبلی کسر
            شوند. فرمول محاسبه:{" "}
            <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
              باقی‌مانده = خریداری‌شده - اجرای دوره‌های قبلی - اجرای دوره جاری
            </code>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">لیست مصالح پای کار</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !materials.length ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              <Package className="size-10 mx-auto mb-2 text-amber-300" />
              مصالحی ثبت نشده
              <br />
              <span className="text-[11px]">
                روی «افزودن مصالح» بزنید تا اولین ردیف را اضافه کنید
              </span>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="text-xs">کد</TableHead>
                    <TableHead className="text-xs">شرح</TableHead>
                    <TableHead className="text-xs">واحد</TableHead>
                    <TableHead className="text-xs text-left">خریداری</TableHead>
                    <TableHead className="text-xs text-left">اجرای قبلی</TableHead>
                    <TableHead className="text-xs text-left">اجرای جاری</TableHead>
                    <TableHead className="text-xs text-left">باقی‌مانده</TableHead>
                    <TableHead className="text-xs text-left">قیمت واحد</TableHead>
                    <TableHead className="text-xs text-left">ارزش کل</TableHead>
                    <TableHead className="text-xs">تأمین‌کننده</TableHead>
                    <TableHead className="text-xs">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((m) => {
                    const isNegative = m.remainingQuantity < 0;
                    return (
                      <TableRow key={m.id} className="text-xs">
                        <TableCell className="font-mono">{m.code}</TableCell>
                        <TableCell className="font-medium">
                          {m.description}
                          {m.invoiceNo && (
                            <Badge variant="outline" className="text-[9px] h-4 mr-1">
                              {m.invoiceNo}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{m.unit}</TableCell>
                        <TableCell className="text-left tabular-nums">
                          {toFa(m.purchasedQuantity)}
                        </TableCell>
                        <TableCell className="text-left tabular-nums text-muted-foreground">
                          {toFa(m.previousExecuted)}
                        </TableCell>
                        <TableCell className="text-left tabular-nums text-amber-600">
                          {toFa(m.currentExecuted)}
                        </TableCell>
                        <TableCell
                          className={`text-left tabular-nums font-bold ${
                            isNegative
                              ? "text-rose-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {toFa(m.remainingQuantity)}
                        </TableCell>
                        <TableCell className="text-left tabular-nums text-muted-foreground">
                          {faRial(m.unitPrice)}
                        </TableCell>
                        <TableCell className="text-left tabular-nums font-medium">
                          {faMoney(m.totalCost)}
                        </TableCell>
                        <TableCell className="text-[11px]">
                          {m.supplier || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-7 p-0"
                              onClick={() => openEdit(m)}
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-7 p-0 text-rose-500 hover:text-rose-600"
                              onClick={() => {
                                if (confirm("حذف مصالح؟"))
                                  deleteMutation.mutate(m.id);
                              }}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editId ? "ویرایش مصالح" : "افزودن مصالح پای کار"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات مصالح خریداری‌شده را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">کد</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="02-101-0101"
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">شرح</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="مثلاً میلگرد آجدار A3"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">واحد</Label>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تأمین‌کننده</Label>
              <Input
                value={form.supplier}
                onChange={(e) =>
                  setForm({ ...form, supplier: e.target.value })
                }
                placeholder="نام شرکت"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">مقدار خریداری‌شده</Label>
              <Input
                type="number"
                value={form.purchasedQuantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    purchasedQuantity: Number(e.target.value),
                  })
                }
                className="h-9 text-xs tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">اجرای دوره‌های قبلی</Label>
              <Input
                type="number"
                value={form.previousExecuted}
                onChange={(e) =>
                  setForm({
                    ...form,
                    previousExecuted: Number(e.target.value),
                  })
                }
                className="h-9 text-xs tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">اجرای دوره جاری</Label>
              <Input
                type="number"
                value={form.currentExecuted}
                onChange={(e) =>
                  setForm({
                    ...form,
                    currentExecuted: Number(e.target.value),
                  })
                }
                className="h-9 text-xs tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">قیمت واحد (ریال)</Label>
              <Input
                type="number"
                value={form.unitPrice}
                onChange={(e) =>
                  setForm({ ...form, unitPrice: Number(e.target.value) })
                }
                className="h-9 text-xs tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">شماره فاکتور</Label>
              <Input
                value={form.invoiceNo}
                onChange={(e) =>
                  setForm({ ...form, invoiceNo: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تاریخ خرید</Label>
              <Input
                type="date"
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm({ ...form, purchaseDate: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">توضیحات</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="یادداشت اختیاری..."
                className="h-9 text-xs"
              />
            </div>
            <div className="col-span-2 rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">باقی‌مانده محاسبه:</span>
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  {toFa(
                    Number(form.purchasedQuantity) -
                      Number(form.previousExecuted) -
                      Number(form.currentExecuted)
                  )}{" "}
                  {form.unit}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-muted-foreground">ارزش کل:</span>
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  {faMoney(
                    Number(form.purchasedQuantity) * Number(form.unitPrice)
                  )}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              انصراف
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700"
              disabled={
                !form.code || !form.description || saveMutation.isPending
              }
              onClick={() => saveMutation.mutate(form)}
            >
              {saveMutation.isPending ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
