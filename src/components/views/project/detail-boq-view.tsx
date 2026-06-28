"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ListChecks,
  Database,
  Loader2,
  Save,
  RefreshCw,
  Calculator,
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import { faNum, faMoney, toFa } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DimensionCalculator } from "@/components/dimensions/dimension-calculator";
import { DocumentManager } from "@/components/documents/document-manager";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CommentThread } from "@/components/comments/comment-thread";

// ─── Types ───────────────────────────────────────────────────────────
interface DetailBoqItem {
  id: string;
  projectId: string;
  priceListItemId: string | null;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  priceListItem?: { id: string; code: string; title: string; unit: string; unitPrice: number } | null;
}

interface CascadeResult {
  summaryBoqUpdated: number;
  financialSheetTotal: number;
  chaptersUpdated: number;
}

interface ProjectResponse {
  project: {
    id: string;
    name: string;
    code: string;
    priceListId: string | null;
    priceList?: {
      id: string;
      year: number;
      discipline: string;
      title: string;
      items: PriceListItem[];
    } | null;
    detailBoqs: DetailBoqItem[];
    summaryBoqs: { id: string; code: string }[];
    financialSheet: { id: string }[];
  };
}

interface PriceListItem {
  id: string;
  code: string;
  title: string;
  unit: string;
  unitPrice: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────
const UNITS = ["مترمربع", "مترمکعب", "متر طول", "تن", "عدد", "کیلوگرم", "لیتر", "دستگاه", "ورق", "گلوله"];

/** تبدیل اعداد فارسی/عربی به لاتین برای ورودی عددی */
function parseFaNumber(input: string): number {
  const en = input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,،\s]/g, "");
  const n = parseFloat(en);
  return isFinite(n) ? n : 0;
}

// ─── Editable Quantity Cell with 800ms debounce ──────────────────────
function QuantityCell({
  item,
  onCommit,
  projectId,
}: {
  item: DetailBoqItem;
  onCommit: (itemId: string, quantity: number) => void;
  projectId: string;
}) {
  const [value, setValue] = React.useState(toFa(item.quantity.toString()));
  const [pending, setPending] = React.useState(false);
  const [calcOpen, setCalcOpen] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setValue(toFa(item.quantity.toString()));
  }, [item.quantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setValue(raw);
    setPending(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const n = parseFaNumber(raw);
      onCommit(item.id, n);
      setPending(false);
    }, 800);
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative flex items-center gap-1">
      <Input
        type="text"
        inputMode="decimal"
        dir="ltr"
        value={value}
        onChange={handleChange}
        className={cn(
          "h-9 w-28 text-left tabular-nums",
          pending && "border-amber-500/60 ring-2 ring-amber-500/20",
        )}
        aria-label="مقدار"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-amber-600 hover:bg-amber-50"
        onClick={() => setCalcOpen(true)}
        title="پشت‌سری (Dimension Calculator)"
      >
        <Calculator className="size-3.5" />
      </Button>
      {pending && (
        <Loader2 className="pointer-events-none absolute left-1.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-amber-500" />
      )}
      <DimensionCalculator
        open={calcOpen}
        onOpenChange={setCalcOpen}
        projectId={projectId}
        onApply={(qty) => {
          setValue(toFa(qty.toFixed(3)));
          onCommit(item.id, qty);
        }}
      />
    </div>
  );
}

// ─── Add/Edit Row Dialog ─────────────────────────────────────────────
interface RowFormValues {
  code: string;
  description: string;
  unit: string;
  quantity: string;
  priceListItemId: string;
}

function RowFormDialog({
  projectId,
  priceListId,
  priceListItems,
  editing,
  onSaved,
}: {
  projectId: string;
  priceListId: string | null;
  priceListItems: PriceListItem[];
  editing: DetailBoqItem | null;
  onSaved: (cascade: CascadeResult | null) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [form, setForm] = React.useState<RowFormValues>({
    code: "",
    description: "",
    unit: "مترمربع",
    quantity: "",
    priceListItemId: "",
  });

  React.useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          code: editing.code,
          description: editing.description,
          unit: editing.unit,
          quantity: toFa(editing.quantity.toString()),
          priceListItemId: editing.priceListItemId || "",
        });
      } else {
        setForm({
          code: "",
          description: "",
          unit: "مترمربع",
          quantity: "",
          priceListItemId: "",
        });
      }
      setSearch("");
    }
  }, [open, editing]);

  const filteredItems = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return priceListItems.slice(0, 50);
    return priceListItems
      .filter(
        (i) =>
          i.code.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [search, priceListItems]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.trim(),
        description: form.description.trim(),
        unit: form.unit,
        quantity: parseFaNumber(form.quantity),
        priceListItemId: form.priceListItemId || undefined,
      };
      if (editing) {
        const r = await fetch(`/api/projects/${projectId}/detail-boq`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: editing.id, ...payload }),
        });
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<{ item: DetailBoqItem; cascade: CascadeResult }>;
      } else {
        const r = await fetch(`/api/projects/${projectId}/detail-boq`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<{ item: DetailBoqItem; cascade: CascadeResult }>;
      }
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      setOpen(false);
      onSaved(data.cascade);
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "خطا در ذخیره ردیف",
        description: err.message || "لطفاً دوباره تلاش کنید",
      });
    },
  });

  // Pick a price list item to autofill
  const pickPriceListItem = (pli: PriceListItem) => {
    setForm((f) => ({
      ...f,
      priceListItemId: pli.id,
      code: pli.code,
      unit: pli.unit,
      description: pli.title,
    }));
  };

  const canSubmit =
    form.code.trim().length > 0 &&
    form.description.trim().length > 0 &&
    form.unit.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editing ? (
          <Button variant="ghost" size="icon" className="size-9" aria-label="ویرایش">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button className="h-9">
            <Plus className="size-4" />
            افزودن ردیف
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "ویرایش ردیف ریزمتره" : "افزودن ردیف ریزمتره"}
          </DialogTitle>
          <DialogDescription>
            کد، شرح، واحد و مقدار را وارد کنید. پس از ذخیره، خلاصه‌متره و برگه مالی به‌صورت خودکار بازمحاسبه می‌شوند.
          </DialogDescription>
        </DialogHeader>

        {/* آیتم‌های فهرست بها picker */}
        {priceListId && priceListItems.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Database className="size-3.5" />
              انتخاب از فهرست بها
              <Badge variant="secondary" className="text-[10px]">
                {toFa(priceListItems.length)} آیتم
              </Badge>
            </div>
            <div className="relative mb-2">
              <Search className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو بر اساس کد یا شرح…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pr-7 text-sm"
              />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-md border bg-background">
              {filteredItems.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  نتیجه‌ای یافت نشد
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredItems.map((pli) => (
                    <li key={pli.id}>
                      <button
                        type="button"
                        onClick={() => pickPriceListItem(pli)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-right transition-colors hover:bg-accent"
                      >
                        <Badge variant="outline" className="shrink-0 font-mono text-[11px]">
                          {pli.code}
                        </Badge>
                        <span className="min-w-0 flex-1 truncate text-sm">{pli.title}</span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">{pli.unit}</span>
                        <span className="shrink-0 text-[11px] tabular-nums text-amber-700 dark:text-amber-400">
                          {faNum(pli.unitPrice)} ریال
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="rf-code">کد</Label>
            <Input
              id="rf-code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="مثلاً 010101"
              dir="ltr"
              className="h-9 text-left"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rf-unit">واحد</Label>
            <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
              <SelectTrigger id="rf-unit" className="h-9 w-full">
                <SelectValue placeholder="انتخاب واحد" />
              </SelectTrigger>
              <SelectContent>
                {UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="rf-desc">شرح</Label>
            <Input
              id="rf-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="شرح عملیات"
              className="h-9"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rf-qty">مقدار</Label>
            <Input
              id="rf-qty"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="مثلاً ۱۲۵٫۵"
              dir="ltr"
              className="h-9 text-left tabular-nums"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="h-9">
            انصراف
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="h-9"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main View ───────────────────────────────────────────────────────
export function DetailBoqView() {
  const projectId = useAppStore((s) => s.selectedProjectId);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ProjectResponse>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}`);
      if (!r.ok) throw new Error("بارگذاری پروژه ناموفق بود");
      return r.json();
    },
    enabled: !!projectId,
  });

  // Fetch price-list items when project has a priceListId
  const priceListId = data?.project?.priceListId ?? null;
  const { data: priceListItemsData } = useQuery<{ items: PriceListItem[] }>({
    queryKey: ["price-list-items", priceListId],
    queryFn: async () => {
      const r = await fetch(`/api/base-data/price-lists/${priceListId}/items`);
      if (!r.ok) throw new Error("بارگذاری آیتم‌های فهرست بها ناموفق بود");
      return r.json();
    },
    enabled: !!priceListId,
  });

  const items = data?.project?.detailBoqs ?? [];
  const priceListItems = priceListItemsData?.items ?? [];

  // ─── Inline quantity mutation ───
  const updateMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const r = await fetch(`/api/projects/${projectId}/detail-boq`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<{ item: DetailBoqItem; cascade: CascadeResult }>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toastCascade(data.cascade);
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "خطا در به‌روزرسانی مقدار",
        description: err.message,
      });
    },
  });

  // ─── Delete mutation ───
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const r = await fetch(
        `/api/projects/${projectId}/detail-boq?itemId=${itemId}`,
        { method: "DELETE" },
      );
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<{ ok: boolean; cascade: CascadeResult }>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toastCascade(data.cascade, "ردیف حذف شد");
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "خطا در حذف ردیف",
        description: err.message,
      });
    },
  });

  const toastCascade = (c: CascadeResult | null, title = "ذخیره شد") => {
    if (!c) {
      toast({ title });
      return;
    }
    toast({
      title,
      description: (
        <span className="text-xs leading-5">
          خلاصه‌متره: <b>{toFa(c.summaryBoqUpdated)}</b> ردیف — برگه مالی:{" "}
          <b>{faMoney(c.financialSheetTotal)}</b> — فصول:{" "}
          <b>{toFa(c.chaptersUpdated)}</b>
        </span>
      ),
    });
  };

  // ─── Empty / loading / error states ───
  if (!projectId) {
    return (
      <EmptyState
        icon={<ListChecks className="size-8" />}
        title="پروژه‌ای انتخاب نشده"
        description="یک پروژه را از نوار کناری انتخاب کنید تا ریزمتره‌ی آن نمایش داده شود."
      />
    );
  }

  if (isLoading) {
    return <DetailBoqSkeleton />;
  }

  if (isError) {
    return (
      <EmptyState
        icon={<RefreshCw className="size-8" />}
        title="خطا در بارگذاری"
        description="بارگذاری پروژه ناموفق بود."
        action={
          <Button variant="outline" className="h-9" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            تلاش مجدد
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <ListChecks className="size-5 text-amber-600" />
            ریزمتره
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            پروژه: <span className="font-medium text-foreground">{data?.project.name}</span>
            {data?.project.priceList && (
              <>
                {" — فهرست بها: "}
                <span className="font-medium text-foreground">
                  {data.project.priceList.title} ({toFa(data.project.priceList.year)})
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            بازخوانی
          </Button>
          <RowFormDialog
            projectId={projectId}
            priceListId={priceListId}
            priceListItems={priceListItems}
            editing={null}
            onSaved={(c) => toastCascade(c, "ردیف جدید اضافه شد")}
          />
        </div>
      </div>

      {/* Cascade info banner */}
      {items.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <Database className="size-4" />
          <AlertTitle className="text-sm">زنجیره‌ی محاسباتی فعال</AlertTitle>
          <AlertDescription className="text-xs">
            هر تغییر در ریزمتره، به‌صورت خودکار خلاصه‌متره، برگه مالی و فصول را بازمحاسبه می‌کند.
            {priceListId ? (
              <> فهرست به‌ی مرتبط با {toFa(priceListItems.length)} آیتم بارگذاری شد.</>
            ) : (
              <span className="font-medium"> هیچ فهرست بهایی به این پروژه متصل نیست.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-8" />}
          title="هنوز ردیفی ثبت نشده"
          description="برای شروع، اولین ردیف ریزمتره را اضافه کنید."
          action={
            <RowFormDialog
              projectId={projectId}
              priceListId={priceListId}
              priceListItems={priceListItems}
              editing={null}
              onSaved={(c) => toastCascade(c, "ردیف جدید اضافه شد")}
            />
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-y-auto">
              <Table className="boq-table">
                <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="h-10 w-14 bg-muted/60 px-3 text-center font-medium">#</TableHead>
                    <TableHead className="h-10 bg-muted/60 px-3 font-medium">کد</TableHead>
                    <TableHead className="h-10 bg-muted/60 px-3 font-medium">شرح</TableHead>
                    <TableHead className="h-10 w-32 bg-muted/60 px-3 font-medium">واحد</TableHead>
                    <TableHead className="h-10 w-40 bg-muted/60 px-3 text-left font-medium">مقدار</TableHead>
                    <TableHead className="h-10 w-36 bg-muted/60 px-3 text-center font-medium">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/30"
                    >
                      <TableCell className="px-3 text-center text-xs text-muted-foreground">
                        {toFa(idx + 1)}
                      </TableCell>
                      <TableCell className="px-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[11px]">
                            {item.code}
                          </Badge>
                          {item.priceListItem && (
                            <span
                              title="متصل به فهرست بها"
                              className="inline-block size-1.5 rounded-full bg-emerald-500"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[40vw] px-3">
                        <div className="truncate text-sm" title={item.description}>
                          {item.description}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 text-xs text-muted-foreground">
                        {item.unit}
                      </TableCell>
                      <TableCell className="px-3 text-left">
                        <QuantityCell
                          item={item}
                          projectId={projectId}
                          onCommit={(itemId, qty) =>
                            updateMutation.mutate({ itemId, quantity: qty })
                          }
                        />
                      </TableCell>
                      <TableCell className="px-3">
                        <div className="flex items-center justify-center gap-1">
                          <RowFormDialog
                            projectId={projectId}
                            priceListId={priceListId}
                            priceListItems={priceListItems}
                            editing={item}
                            onSaved={(c) => toastCascade(c, "ردیف ویرایش شد")}
                          />
                          <CommentThread
                            projectId={projectId}
                            entityType="DETAIL_BOQ"
                            entityId={item.id}
                            entityLabel={`ردیف ریزمتره — کد ${item.code}${item.description ? ` (${item.description.slice(0, 40)})` : ""}`}
                          />
                          <DocumentManager
                            projectId={projectId}
                            entityType="DETAIL_BOQ"
                            entityId={item.id}
                            itemCode={item.code}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                            aria-label="حذف"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (confirm(`حذف ردیف «${item.description}»؟`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Footer summary */}
            <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-4 py-2.5 text-xs">
              <span className="text-muted-foreground">
                مجموع ردیف‌ها: <b className="text-foreground">{toFa(items.length)}</b>
              </span>
              <span className="text-muted-foreground">
                مجموع مقدار:{" "}
                <b className="text-foreground tabular-nums">
                  {faNum(items.reduce((s, i) => s + (i.quantity || 0), 0), 2)}
                </b>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────
function DetailBoqSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-16 w-full" />
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[70vh] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableHead key={i} className="bg-muted/40">
                      <Skeleton className="h-4 w-12" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, r) => (
                  <TableRow key={r}>
                    {Array.from({ length: 6 }).map((_, c) => (
                      <TableCell key={c}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────
function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export default DetailBoqView;
