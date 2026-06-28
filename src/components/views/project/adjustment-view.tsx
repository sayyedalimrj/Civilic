"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  SlidersHorizontal,
  Wrench,
  Truck,
  Info,
  Loader2,
  ArrowLeft,
  Sigma,
} from "lucide-react";

import { useAppStore } from "@/lib/store";
import { faNum, faMoney, faRial, faPct, toFa } from "@/lib/fa";
import {
  applyAdjustment,
  computeMaterialWithWaste,
  computeTransportDiff,
} from "@/lib/calc/cascade";
import { useToast, toast as globalToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

// ─── Types ───────────────────────────────────────────────────────────
interface PaymentItem {
  id: string;
  paymentId: string;
  code: string;
  description: string;
  unit: string;
  totalQuantity: number;
  executedQuantity: number;
  executedPercent: number;
  unitPrice: number;
  executedAmount: number;
  adjustedAmount: number;
  isAdjusted: boolean;
}

interface Payment {
  id: string;
  projectId: string;
  periodNo: number;
  status: string;
  executedAmount: number;
  items: PaymentItem[];
}

interface ProjectResponse {
  project: {
    id: string;
    name: string;
    code: string;
    year: number;
    priceList?: { discipline: string } | null;
    payments: Payment[];
  };
}

interface IndexRecord {
  id: string;
  year: number;
  season: string;
  discipline: string;
  value: number;
}

interface MaterialRate {
  id: string;
  material: string;
  source: string;
  year: number;
  rate: number;
  wasteFactor: number;
}

interface CityDistance {
  id: string;
  fromCity: string;
  toCity: string;
  km: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function parseFaNumber(input: string): number {
  const en = input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[,،\s]/g, "");
  const n = parseFloat(en);
  return isFinite(n) ? n : 0;
}

// ─── Main View ───────────────────────────────────────────────────────
export function AdjustmentView() {
  const projectId = useAppStore((s) => s.selectedProjectId);

  if (!projectId) {
    return (
      <EmptyState
        icon={<Calculator className="size-8" />}
        title="پروژه‌ای انتخاب نشده"
        description="یک پروژه را از نوار کناری انتخاب کنید تا ابزارهای تعدیل فعال شوند."
      />
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Calculator className="size-5 text-amber-600" />
          تعدیل
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          ابزارهای محاسبه‌ی تعدیل صورت‌وضعیت با شاخص، فرم آهن و سیمان و فرم حمل
        </p>
      </div>

      <Tabs defaultValue="payment" className="w-full">
        <TabsList className="h-10 w-full justify-start gap-1">
          <TabsTrigger value="payment" className="gap-1.5">
            <SlidersHorizontal className="size-4" />
            تعدیل صورت‌وضعیت
          </TabsTrigger>
          <TabsTrigger value="material" className="gap-1.5">
            <Wrench className="size-4" />
            فرم آهن و سیمان
          </TabsTrigger>
          <TabsTrigger value="transport" className="gap-1.5">
            <Truck className="size-4" />
            فرم حمل
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="mt-4">
          <PaymentAdjustmentTab />
        </TabsContent>
        <TabsContent value="material" className="mt-4">
          <MaterialTab />
        </TabsContent>
        <TabsContent value="transport" className="mt-4">
          <TransportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  Tab 1: Payment Adjustment — تعدیل صورت‌وضعیت
// ═════════════════════════════════════════════════════════════════════
function PaymentAdjustmentTab() {
  const projectId = useAppStore((s) => s.selectedProjectId);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<ProjectResponse>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}`);
      if (!r.ok) throw new Error("بارگذاری پروژه ناموفق بود");
      return r.json();
    },
    enabled: !!projectId,
  });

  const project = data?.project;
  const payments = project?.payments ?? [];
  const discipline = project?.priceList?.discipline;

  const { data: indicesData, isLoading: indicesLoading } = useQuery<{
    indices: IndexRecord[];
  }>({
    queryKey: ["base-data", "indices"],
    queryFn: async () => {
      const r = await fetch("/api/base-data/indices");
      return r.json();
    },
  });

  // فیلتر شاخص‌ها بر اساس رشته‌ی پروژه + کلی
  const indices = React.useMemo(() => {
    const all = indicesData?.indices ?? [];
    if (!discipline) return all;
    const filtered = all.filter(
      (i) => i.discipline === discipline || i.discipline === "کلی",
    );
    return filtered.length > 0 ? filtered : all;
  }, [indicesData, discipline]);

  const [selectedPeriod, setSelectedPeriod] = React.useState<string>("");
  const selectedPayment = payments.find((p) => String(p.periodNo) === selectedPeriod);

  React.useEffect(() => {
    if (!selectedPeriod && payments.length > 0) {
      setSelectedPeriod(String(payments[0].periodNo));
    }
  }, [payments, selectedPeriod]);

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      itemId: string;
      isAdjusted: boolean;
      indexFrom?: number;
      indexTo?: number;
    }) => {
      const r = await fetch(
        `/api/projects/${projectId}/payments/${selectedPeriod}/items`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!r.ok) throw new Error(await r.text());
      return r.json() as Promise<{ item: PaymentItem; payment: Payment }>;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      toast({
        title: "تعدیل اعمال شد",
        description: (
          <span className="text-xs leading-5">
            ردیف <b>{res.item.code}</b> — مبلغ اجرا:{" "}
            <b>{faMoney(res.item.executedAmount)}</b> — مبلغ تعدیل‌شده:{" "}
            <b>{faMoney(res.item.adjustedAmount)}</b>
          </span>
        ),
      });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "خطا در اعمال تعدیل",
        description: err.message,
      });
    },
  });

  if (isLoading || indicesLoading) return <AdjustmentSkeleton />;

  if (payments.length === 0) {
    return (
      <EmptyState
        icon={<SlidersHorizontal className="size-8" />}
        title="صورت‌وضعیتی موجود نیست"
        description="برای اعمال تعدیل، ابتدا در تب «صورت‌وضعیت‌ها» یک دوره ایجاد کنید."
      />
    );
  }

  const items = selectedPayment?.items ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="size-4 text-amber-600" />
          تعدیل صورت‌وضعیت با شاخص
        </CardTitle>
        <CardDescription className="text-xs">
          انتخاب دوره و اعمال تعدیل بر اساس شاخص پایه و جاری برای هر ردیف
          {discipline ? (
            <Badge variant="outline" className="mr-2 text-[10px]">
              رشته: {discipline}
            </Badge>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period selector */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">دوره‌ی صورت‌وضعیت</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue placeholder="انتخاب دوره" />
              </SelectTrigger>
              <SelectContent>
                {payments.map((p) => (
                  <SelectItem key={p.id} value={String(p.periodNo)}>
                    دوره‌ی {toFa(p.periodNo)}{" "}
                    <span className="text-muted-foreground">
                      ({toFa(p.items.length)} ردیف)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {indices.length > 0 ? (
            <Alert className="flex-1 border-amber-200 bg-amber-50 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
              <Info className="size-4" />
              <AlertDescription className="text-[11px]">
                شاخص‌های موجود: {toFa(indices.length)} رکورد از سال{" "}
                {toFa(indices[0]?.year ?? 0)} تا {toFa(indices[indices.length - 1]?.year ?? 0)}
                . برای هر ردیف، شاخص پایه (مبنا) و شاخص جاری را انتخاب کنید.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="flex-1 border-amber-200 bg-amber-50 py-2 dark:border-amber-900/40 dark:bg-amber-950/30">
              <Info className="size-4" />
              <AlertDescription className="text-[11px]">
                شاخصی در سامانه ثبت نشده است. از بخش «داده‌های پایه» شاخص‌ها را اضافه کنید.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Items table */}
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            این دوره ردیفی ندارد.
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border">
            <Table className="boq-table text-sm">
              <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                <TableRow className="border-b hover:bg-transparent">
                  <TableHead className="h-10 bg-muted/60 px-2 font-medium">کد</TableHead>
                  <TableHead className="h-10 bg-muted/60 px-2 font-medium">شرح</TableHead>
                  <TableHead className="h-10 w-32 bg-muted/60 px-2 text-left font-medium">مبلغ اجرا</TableHead>
                  <TableHead className="h-10 w-24 bg-muted/60 px-2 text-center font-medium">اعمال تعدیل</TableHead>
                  <TableHead className="h-10 w-40 bg-muted/60 px-2 text-center font-medium">شاخص مبنا</TableHead>
                  <TableHead className="h-10 w-40 bg-muted/60 px-2 text-center font-medium">شاخص جاری</TableHead>
                  <TableHead className="h-10 w-32 bg-muted/60 px-2 text-left font-medium">تعدیل‌شده</TableHead>
                  <TableHead className="h-10 w-20 bg-muted/60 px-2 text-center font-medium">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <AdjustmentRow
                    key={item.id}
                    item={item}
                    indices={indices}
                    pending={
                      updateMutation.isPending &&
                      updateMutation.variables?.itemId === item.id
                    }
                    onCommit={(payload) => updateMutation.mutate(payload)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <FormulaCard
          title="فرمول محاسبه‌ی تعدیل"
          formula="مبلغ تعدیل‌شده = مبلغ اجرا × (شاخص جاری ÷ شاخص مبنا)"
          description="در صورت اعمال تعدیل، مبلغ اجرای هر ردیف با نسبت شاخص‌ها ضرب می‌شود. شاخص صفر یا نامعتبر، تعدیل را غیرفعال می‌کند."
        />
      </CardContent>
    </Card>
  );
}

function AdjustmentRow({
  item,
  indices,
  pending,
  onCommit,
}: {
  item: PaymentItem;
  indices: IndexRecord[];
  pending: boolean;
  onCommit: (payload: {
    itemId: string;
    isAdjusted: boolean;
    indexFrom?: number;
    indexTo?: number;
  }) => void;
}) {
  const [isAdjusted, setIsAdjusted] = React.useState(item.isAdjusted);
  const [fromId, setFromId] = React.useState<string>("");
  const [toId, setToId] = React.useState<string>("");

  React.useEffect(() => {
    setIsAdjusted(item.isAdjusted);
  }, [item.isAdjusted]);

  const indexFrom = indices.find((i) => i.id === fromId)?.value ?? 0;
  const indexTo = indices.find((i) => i.id === toId)?.value ?? 0;
  const preview = isAdjusted && indexFrom > 0
    ? applyAdjustment(item.executedAmount, indexFrom, indexTo)
    : item.adjustedAmount || item.executedAmount;
  const diff = preview - item.executedAmount;

  const handleToggle = (checked: boolean) => {
    setIsAdjusted(checked);
    if (!checked) {
      onCommit({ itemId: item.id, isAdjusted: false });
    }
  };

  const handleApply = () => {
    if (!isAdjusted || indexFrom <= 0) {
      globalToast({
        variant: "destructive",
        title: "تعدیل نامعتبر",
        description: "شاخص مبنا باید بزرگ‌تر از صفر باشد.",
      });
      return;
    }
    onCommit({
      itemId: item.id,
      isAdjusted: true,
      indexFrom,
      indexTo,
    });
  };

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="px-2">
        <Badge variant="outline" className="font-mono text-[11px]">
          {item.code}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[20vw] px-2">
        <div className="truncate text-xs" title={item.description}>
          {item.description}
        </div>
      </TableCell>
      <TableCell className="px-2 text-left text-xs font-semibold tabular-nums">
        {faRial(item.executedAmount)}
      </TableCell>
      <TableCell className="px-2 text-center">
        <Switch checked={isAdjusted} onCheckedChange={handleToggle} aria-label="اعمال تعدیل" />
      </TableCell>
      <TableCell className="px-2">
        {isAdjusted ? (
          <Select value={fromId} onValueChange={setFromId}>
            <SelectTrigger size="sm" className="h-8 w-full text-[11px]">
              <SelectValue placeholder="شاخص مبنا" />
            </SelectTrigger>
            <SelectContent>
              {indices.map((i) => (
                <SelectItem key={i.id} value={i.id} className="text-[11px]">
                  {toFa(i.year)} — {i.season}{" "}
                  <span className="text-muted-foreground">({toFa(i.value.toFixed(2))})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="px-2">
        {isAdjusted ? (
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger size="sm" className="h-8 w-full text-[11px]">
              <SelectValue placeholder="شاخص جاری" />
            </SelectTrigger>
            <SelectContent>
              {indices.map((i) => (
                <SelectItem key={i.id} value={i.id} className="text-[11px]">
                  {toFa(i.year)} — {i.season}{" "}
                  <span className="text-muted-foreground">({toFa(i.value.toFixed(2))})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell
        className={cn(
          "px-2 text-left text-xs tabular-nums",
          isAdjusted && Math.abs(diff) > 0.01 && "font-semibold text-amber-700 dark:text-amber-300",
        )}
      >
        {faRial(preview)}
        {isAdjusted && Math.abs(diff) > 0.01 ? (
          <div className={cn("text-[9px]", diff > 0 ? "text-emerald-600" : "text-rose-600")}>
            {diff > 0 ? "+" : "−"} {faMoney(Math.abs(diff))}
          </div>
        ) : null}
      </TableCell>
      <TableCell className="px-2 text-center">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-[11px]"
          disabled={!isAdjusted || pending || indexFrom <= 0 || !fromId || !toId}
          onClick={handleApply}
        >
          {pending ? <Loader2 className="size-3 animate-spin" /> : <ArrowLeft className="size-3" />}
          اعمال
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  Tab 2: Material (Iron & Cement) — فرم آهن و سیمان
// ═════════════════════════════════════════════════════════════════════
function MaterialTab() {
  const { data: materialsData, isLoading } = useQuery<{ materials: MaterialRate[] }>({
    queryKey: ["base-data", "materials"],
    queryFn: async () => {
      const r = await fetch("/api/base-data/materials");
      return r.json();
    },
  });

  const materials = materialsData?.materials ?? [];

  const [baseQty, setBaseQty] = React.useState("100");
  const [materialId, setMaterialId] = React.useState<string>("");
  const [deduction, setDeduction] = React.useState("0");

  React.useEffect(() => {
    if (!materialId && materials.length > 0) setMaterialId(materials[0].id);
  }, [materials, materialId]);

  const material = materials.find((m) => m.id === materialId);

  const result = React.useMemo(() => {
    const base = parseFaNumber(baseQty);
    const ded = parseFaNumber(deduction);
    const wf = material?.wasteFactor ?? 1.0;
    return { base, ded, wf, ...computeMaterialWithWaste(base, wf, ded) };
  }, [baseQty, deduction, material]);

  if (isLoading) return <AdjustmentSkeleton />;

  if (materials.length === 0) {
    return (
      <EmptyState
        icon={<Wrench className="size-8" />}
        title="مصالحی ثبت نشده"
        description="برای محاسبه‌ی فرم آهن و سیمان، ابتدا نرخ مصالح را در بخش «داده‌های پایه» ثبت کنید."
      />
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wrench className="size-4 text-amber-600" />
          فرم آهن و سیمان — اعمال ضریب پرت
        </CardTitle>
        <CardDescription className="text-xs">
          محاسبه‌ی مقدار نهایی مصالح با کسر کسور و اعمال ضریب پرت (مثلاً ۱.۰۶ برای سیمان)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">مقدار پایه</Label>
            <Input
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={baseQty}
              onChange={(e) => setBaseQty(e.target.value)}
              className="h-9 text-left tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">مصالح</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="انتخاب مصالح" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.material}{" "}
                    <span className="text-muted-foreground">
                      — {toFa(m.year)} ({m.source})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">درصد کسور (٪)</Label>
            <Input
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={deduction}
              onChange={(e) => setDeduction(e.target.value)}
              className="h-9 text-left tabular-nums"
            />
          </div>
        </div>

        {/* Material info */}
        {material ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <InfoCell label="مصالح" value={material.material} />
            <InfoCell label="ضریب پرت" value={toFa(material.wasteFactor.toFixed(2))} />
            <InfoCell label="نرخ پایه" value={`${faNum(material.rate)} ریال`} />
          </div>
        ) : null}

        {/* Step-by-step computation */}
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Sigma className="size-4 text-amber-600" />
            محاسبه‌ی گام‌به‌گام
          </div>
          <ol className="space-y-2 text-xs">
            <Step
              n={1}
              title="مقدار خالص"
              formula={`مقدار پایه × (۱ − کسور/۱۰۰) = ${toFa(result.base.toFixed(2))} × (۱ − ${toFa(result.ded.toFixed(2))}/۱۰۰)`}
              value={`${faNum(result.netQuantity, 2)}`}
            />
            <Step
              n={2}
              title="اعمال ضریب پرت"
              formula={`مقدار خالص × ضریب پرت = ${faNum(result.netQuantity, 2)} × ${toFa(result.wf.toFixed(2))}`}
              value={`${faNum(result.withWaste, 2)}`}
            />
            <Separator className="my-2" />
            <Step
              n={3}
              title="مقدار نهایی"
              formula=""
              value={`${faNum(result.finalQuantity, 2)}`}
              highlight
            />
          </ol>
        </div>

        <FormulaCard
          title="فرمول محاسبه"
          formula="مقدار نهایی = مقدار پایه × (۱ − کسور/۱۰۰) × ضریب پرت"
          description="ضریب پرت برای مصالحی نظیر سیمان برابر ۱.۰۶ و برای آهن معمولاً ۱.۰۳ در نظر گرفته می‌شود."
        />
      </CardContent>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  Tab 3: Transport — فرم حمل
// ═════════════════════════════════════════════════════════════════════
function TransportTab() {
  const { data: citiesData, isLoading } = useQuery<{
    cities: string[];
    count: number;
  }>({
    queryKey: ["base-data", "distances"],
    queryFn: async () => {
      const r = await fetch("/api/base-data/distances");
      return r.json();
    },
  });

  const cities = citiesData?.cities ?? [];

  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [unitRate, setUnitRate] = React.useState("5000");
  const [contractDistance, setContractDistance] = React.useState("0");

  React.useEffect(() => {
    if (!from && cities.length > 0) setFrom(cities[0]);
    if (!to && cities.length > 1) setTo(cities[1]);
  }, [cities, from, to]);

  const { data: distanceData, isLoading: distanceLoading } = useQuery<{
    distance: CityDistance | null;
  }>({
    queryKey: ["base-data", "distances", from, to],
    queryFn: async () => {
      const r = await fetch(
        `/api/base-data/distances?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      return r.json();
    },
    enabled: !!from && !!to,
  });

  const distance = distanceData?.distance?.km ?? 0;

  const result = React.useMemo(() => {
    const rate = parseFaNumber(unitRate);
    const cd = parseFaNumber(contractDistance);
    return {
      rate,
      cd,
      distance,
      ...computeTransportDiff(distance, rate, cd),
    };
  }, [distance, unitRate, contractDistance]);

  if (isLoading) return <AdjustmentSkeleton />;

  if (cities.length === 0) {
    return (
      <EmptyState
        icon={<Truck className="size-8" />}
        title="شهر/مسافتی ثبت نشده"
        description="برای محاسبه‌ی فرم حمل، ابتدا در بخش «داده‌های پایه» مسافت‌های بین شهرها را ثبت کنید."
      />
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Truck className="size-4 text-amber-600" />
          فرم حمل — محاسبه‌ی مابه‌التفاوت مسافت
        </CardTitle>
        <CardDescription className="text-xs">
          محاسبه‌ی تفاوت هزینه‌ی حمل بین مسافت واقعی و مسافت قراردادی
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">مبدا</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="شهر مبدا" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">مقصد</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="شهر مقصد" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">نرخ واحد حمل (ریال/کیلومتر)</Label>
            <Input
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={unitRate}
              onChange={(e) => setUnitRate(e.target.value)}
              className="h-9 text-left tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">مسافت قراردادی (کیلومتر)</Label>
            <Input
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={contractDistance}
              onChange={(e) => setContractDistance(e.target.value)}
              className="h-9 text-left tabular-nums"
            />
          </div>
        </div>

        {/* Distance display */}
        <div className="grid gap-2 sm:grid-cols-3">
          <InfoCell
            label="مسافت واقعی"
            value={
              distanceLoading
                ? "در حال بارگذاری…"
                : distance > 0
                  ? `${faNum(distance, 1)} کیلومتر`
                  : "یافت نشد"
            }
          />
          <InfoCell label="مسافت قراردادی" value={`${faNum(result.cd, 1)} کیلومتر`} />
          <InfoCell
            label="مابه‌التفاوت"
            value={`${faNum(distance - result.cd, 1)} کیلومتر`}
            highlight={(distance - result.cd) !== 0}
          />
        </div>

        {/* Step-by-step */}
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Sigma className="size-4 text-amber-600" />
            محاسبه‌ی گام‌به‌گام
          </div>
          <ol className="space-y-2 text-xs">
            <Step
              n={1}
              title="هزینه‌ی حمل پایه (قراردادی)"
              formula={`مسافت قراردادی × نرخ = ${faNum(result.cd, 1)} × ${faNum(result.rate)}`}
              value={faRial(result.baseTransport)}
            />
            <Step
              n={2}
              title="هزینه‌ی حمل واقعی"
              formula={`مسافت واقعی × نرخ = ${faNum(distance, 1)} × ${faNum(result.rate)}`}
              value={faRial(result.actualTransport)}
            />
            <Separator className="my-2" />
            <Step
              n={3}
              title="مابه‌التفاوت قابل پرداخت"
              formula="هزینه‌ی واقعی − هزینه‌ی قراردادی"
              value={faRial(result.difference)}
              highlight
            />
          </ol>
        </div>

        <FormulaCard
          title="فرمول محاسبه"
          formula="مابه‌التفاوت = (مسافت واقعی − مسافت قراردادی) × نرخ واحد حمل"
          description="در صورت مثبت بودن مابه‌التفاوت، مبلغ اضافه به پیمانکار پرداخت می‌شود؛ در صورت منفی بودن، کسر خواهد شد."
        />
      </CardContent>
    </Card>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────
function InfoCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        highlight
          ? "border-amber-300 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/30"
          : "bg-muted/20",
      )}
    >
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Step({
  n,
  title,
  formula,
  value,
  highlight,
}: {
  n: number;
  title: string;
  formula: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
          highlight
            ? "bg-amber-500 text-white"
            : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        )}
      >
        {toFa(n)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium">{title}</div>
        {formula ? (
          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground" dir="ltr">
            {formula}
          </div>
        ) : null}
        <div
          className={cn(
            "mt-1 text-sm font-bold tabular-nums",
            highlight && "text-amber-900 dark:text-amber-200",
          )}
        >
          {value}
        </div>
      </div>
    </li>
  );
}

function FormulaCard({
  title,
  formula,
  description,
}: {
  title: string;
  formula: string;
  description: string;
}) {
  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30">
      <Info className="size-4" />
      <AlertTitle className="text-xs">{title}</AlertTitle>
      <AlertDescription className="text-[11px]">
        <code className="block rounded bg-amber-100/60 px-2 py-1 font-mono text-[10px] text-amber-900 dark:bg-amber-900/30 dark:text-amber-200" dir="ltr">
          {formula}
        </code>
        <span className="mt-1.5 block">{description}</span>
      </AlertDescription>
    </Alert>
  );
}

function AdjustmentSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
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

export default AdjustmentView;
