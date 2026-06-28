"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  Square,
  Circle,
  Triangle,
  Save,
  RotateCcw,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";

interface DimensionParams {
  length?: number;
  width?: number;
  height?: number;
  radius?: number;
  count?: number;
  slope?: number;
  topWidth?: number;
  bottomWidth?: number;
}

type ShapeType =
  | "RECTANGLE"
  | "CIRCLE"
  | "TRAPEZOID"
  | "TRIANGLE"
  | "SLOPED_EXCAVATION"
  | "COUNT_ONLY";

const SHAPES: { type: ShapeType; label: string; icon: typeof Square; formula: string }[] = [
  { type: "RECTANGLE", label: "مستطیل / مکعب", icon: Square, formula: "L × W × H × تعداد" },
  { type: "CIRCLE", label: "دایره / استوانه", icon: Circle, formula: "π × r² × H × تعداد" },
  { type: "TRAPEZOID", label: "ذوزنقه", icon: Square, formula: "((a + b) × H / 2) × L × تعداد" },
  { type: "TRIANGLE", label: "مثلث", icon: Triangle, formula: "(W × H / 2) × L × تعداد" },
  { type: "SLOPED_EXCAVATION", label: "حفاری با شیب", icon: Triangle, formula: "L×W×H + slope×H²×(L+W) + (4/3)×slope²×H³" },
  { type: "COUNT_ONLY", label: "فقط تعداد", icon: Plus, formula: "تعداد" },
];

interface DimensionCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialShape?: ShapeType;
  initialParams?: DimensionParams;
  onApply: (quantity: number, shape: ShapeType, params: DimensionParams) => void;
}

export function DimensionCalculator({
  open,
  onOpenChange,
  projectId,
  initialShape = "RECTANGLE",
  initialParams = {},
  onApply,
}: DimensionCalculatorProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  // مقداردهی اولیه فقط با useState — هنگام باز شدن، prop ها تزریق می‌شوند
  const [shape, setShape] = useState<ShapeType>(initialShape);
  const [params, setParams] = useState<DimensionParams>(initialParams);
  const [templateName, setTemplateName] = useState("");
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  const { data: templatesData } = useQuery<{ formulas: any[] }>({
    queryKey: ["dimension-templates", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/dimensions?projectId=${projectId}`);
      return r.json();
    },
    enabled: open,
  });

  const computed = computeShape(shape, params);

  const saveTemplate = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/dimensions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: templateName,
          shape,
          params,
          unit: shapeUnit(shape),
          isReusable: true,
        }),
      });
      if (!r.ok) throw new Error("خطا در ذخیره");
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "قالب ذخیره شد" });
      setTemplateName("");
      setSaveTemplateOpen(false);
      qc.invalidateQueries({ queryKey: ["dimension-templates", projectId] });
    },
  });

  const applyTemplate = (tpl: any) => {
    setShape(tpl.shape as ShapeType);
    setParams(JSON.parse(tpl.params));
    toast({ title: `قالب «${tpl.name}» بارگذاری شد` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="size-5 text-amber-600" />
            محاسبه‌گر پشت‌سری (Dimension Calculator)
          </DialogTitle>
          <DialogDescription>
            با انتخاب شکل هندسی و وارد کردن ابعاد، مقدار به‌صورت خودکار محاسبه می‌شود
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">نوع شکل</Label>
          <div className="grid grid-cols-3 gap-2">
            {SHAPES.map((s) => {
              const Icon = s.icon;
              const active = shape === s.type;
              return (
                <button
                  key={s.type}
                  onClick={() => setShape(s.type)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md border p-2 text-center transition-colors",
                    active
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <Icon className={cn("size-5", active ? "text-amber-600" : "text-muted-foreground")} />
                  <span className="text-[10px] font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            فرمول:{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
              {SHAPES.find((s) => s.type === shape)?.formula}
            </code>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3">
          {(shape === "RECTANGLE" || shape === "TRAPEZOID" || shape === "TRIANGLE" || shape === "SLOPED_EXCAVATION") && (
            <ParamInput
              label="طول (L)"
              value={params.length}
              onChange={(v) => setParams({ ...params, length: v })}
              unit="متر"
            />
          )}
          {(shape === "RECTANGLE" || shape === "TRIANGLE") && (
            <ParamInput
              label="عرض (W)"
              value={params.width}
              onChange={(v) => setParams({ ...params, width: v })}
              unit="متر"
            />
          )}
          {shape === "RECTANGLE" && (
            <ParamInput
              label="ارتفاع (H)"
              value={params.height}
              onChange={(v) => setParams({ ...params, height: v })}
              unit="متر"
            />
          )}
          {shape === "CIRCLE" && (
            <>
              <ParamInput
                label="شعاع (r)"
                value={params.radius}
                onChange={(v) => setParams({ ...params, radius: v })}
                unit="متر"
              />
              <ParamInput
                label="ارتفاع (H)"
                value={params.height}
                onChange={(v) => setParams({ ...params, height: v })}
                unit="متر"
              />
            </>
          )}
          {shape === "TRAPEZOID" && (
            <>
              <ParamInput
                label="قاعده بالا (a)"
                value={params.topWidth}
                onChange={(v) => setParams({ ...params, topWidth: v })}
                unit="متر"
              />
              <ParamInput
                label="قاعده پایین (b)"
                value={params.bottomWidth}
                onChange={(v) => setParams({ ...params, bottomWidth: v })}
                unit="متر"
              />
              <ParamInput
                label="ارتفاع (H)"
                value={params.height}
                onChange={(v) => setParams({ ...params, height: v })}
                unit="متر"
              />
            </>
          )}
          {shape === "SLOPED_EXCAVATION" && (
            <>
              <ParamInput
                label="عرض (W)"
                value={params.width}
                onChange={(v) => setParams({ ...params, width: v })}
                unit="متر"
              />
              <ParamInput
                label="ارتفاع/عمق (H)"
                value={params.height}
                onChange={(v) => setParams({ ...params, height: v })}
                unit="متر"
              />
              <ParamInput
                label="ضریب شیب (slope)"
                value={params.slope}
                onChange={(v) => setParams({ ...params, slope: v })}
                unit="—"
                step={0.1}
              />
            </>
          )}
          {shape !== "COUNT_ONLY" && (
            <ParamInput
              label="تعداد"
              value={params.count}
              onChange={(v) => setParams({ ...params, count: v })}
              unit="عدد"
            />
          )}
          {shape === "COUNT_ONLY" && (
            <ParamInput
              label="تعداد"
              value={params.count}
              onChange={(v) => setParams({ ...params, count: v })}
              unit="عدد"
            />
          )}
        </div>

        <div className="rounded-lg bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 border-2 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted-foreground">مقدار محاسبه‌شده</div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1 tabular-nums">
                {toFa(computed.toFixed(3))}
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              واحد: {shapeUnit(shape)}
            </Badge>
          </div>
        </div>

        {templatesData?.formulas && templatesData.formulas.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>قالب‌های ذخیره‌شده ({toFa(templatesData.formulas.length)})</span>
              </Label>
              <ScrollArea className="h-24">
                <div className="grid grid-cols-2 gap-2 pr-1">
                  {templatesData.formulas.map((tpl: any) => (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      className="text-right p-2 rounded-md border hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-xs font-medium truncate">{tpl.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {SHAPES.find((s) => s.type === tpl.shape)?.label} • نتیجه: {toFa(Number(tpl.lastResult).toFixed(2))}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {saveTemplateOpen && (
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">نام قالب</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="مثلاً حفاری با عرض ۲ متر"
                className="h-9 text-xs"
              />
            </div>
            <Button
              size="sm"
              className="h-9"
              disabled={!templateName.trim() || saveTemplate.isPending}
              onClick={() => saveTemplate.mutate()}
            >
              <Save className="size-4" />
              ذخیره
            </Button>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setParams({});
              setShape(initialShape);
            }}
          >
            <RotateCcw className="size-4" />
            پاک‌کردن
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSaveTemplateOpen((v) => !v)}
          >
            <Save className="size-4" />
            ذخیره به‌عنوان قالب
          </Button>
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-700"
            onClick={() => {
              onApply(computed, shape, params);
              onOpenChange(false);
            }}
          >
            <Calculator className="size-4" />
            اعمال در ردیف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ParamInput({
  label,
  value,
  onChange,
  unit,
  step = 0.01,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  unit: string;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[9px] text-muted-foreground">{unit}</span>
      </Label>
      <Input
        type="number"
        value={value ?? ""}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-9 text-xs tabular-nums"
      />
    </div>
  );
}

function shapeUnit(shape: ShapeType): string {
  switch (shape) {
    case "RECTANGLE":
    case "CIRCLE":
    case "TRAPEZOID":
    case "TRIANGLE":
    case "SLOPED_EXCAVATION":
      return "مترمکعب";
    case "COUNT_ONLY":
      return "عدد";
    default:
      return "—";
  }
}

function computeShape(shape: ShapeType, p: DimensionParams): number {
  const length = Number(p.length || 0);
  const width = Number(p.width || 0);
  const height = Number(p.height || 0);
  const count = Number(p.count || 1);
  const radius = Number(p.radius || 0);
  const slope = Number(p.slope || 0);
  const topWidth = Number(p.topWidth || 0);
  const bottomWidth = Number(p.bottomWidth || 0);

  switch (shape) {
    case "RECTANGLE":
      return length * width * height * count;
    case "CIRCLE":
      return Math.PI * radius * radius * height * count;
    case "TRAPEZOID":
      return ((topWidth + bottomWidth) * height / 2) * length * count;
    case "TRIANGLE":
      return (width * height / 2) * length * count;
    case "SLOPED_EXCAVATION":
      return (
        length * width * height +
        slope * height * height * (length + width) +
        (4 / 3) * slope * slope * height * height * height
      ) * count;
    case "COUNT_ONLY":
      return count;
    default:
      return 0;
  }
}
