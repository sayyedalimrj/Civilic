"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Info,
  Save,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { faNum, faMoney, faRial, toFa, faPct } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";

interface BidRange {
  id: string;
  overheadPct: number;
  profitPct: number;
  riskPct: number;
  baseAmount: number;
  floorAmount: number;
  ceilingAmount: number;
  suggestedAmount: number;
  notes: string | null;
}

export function BidRangeView() {
  const { selectedProjectId } = useAppStore();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [overheadPct, setOverheadPct] = useState(15);
  const [profitPct, setProfitPct] = useState(8);
  const [riskPct, setRiskPct] = useState(5);
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery<{
    bidRange: BidRange | null;
    computedBase: number;
  }>({
    queryKey: ["bid-range", selectedProjectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}/bid-range`);
      return r.json();
    },
    enabled: !!selectedProjectId,
  });

  // initialize from server
  useState(() => {
    if (data?.bidRange) {
      setOverheadPct(data.bidRange.overheadPct);
      setProfitPct(data.bidRange.profitPct);
      setRiskPct(data.bidRange.riskPct);
      setNotes(data.bidRange.notes || "");
    }
  });

  const base = data?.bidRange?.baseAmount || data?.computedBase || 0;

  const computeMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/projects/${selectedProjectId}/bid-range`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overheadPct,
          profitPct,
          riskPct,
          baseAmount: base,
          notes,
        }),
      });
      if (!r.ok) throw new Error("خطا");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bid-range", selectedProjectId] });
      toast({ title: "دامنه قیمت محاسبه و ذخیره شد" });
    },
  });

  // live preview
  const overheadAmount = (base * overheadPct) / 100;
  const profitAmount = ((base + overheadAmount) * profitPct) / 100;
  const riskAmount =
    ((base + overheadAmount + profitAmount) * riskPct) / 100;
  const ceilingAmount = base + overheadAmount + profitAmount + riskAmount;
  const floorAmount = base * 0.92;
  const suggestedAmount = (ceilingAmount + floorAmount) / 2;

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Target className="size-5 text-amber-600" />
          دامنه قیمت پیشنهادی
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          محاسبه‌ی کف و سقف قیمت برای شرکت در مناقصه بر اساس درصد بالاسری، سود و
          ضرایب ریسک
        </p>
      </div>

      {/* Info alert */}
      <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
        <div className="flex items-start gap-2">
          <Info className="size-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-900 dark:text-blue-200">
            <strong>قانون مناقصه:</strong> کف قانونی قیمت ۸٪ پایین‌تر از مبلغ پایه
            است. سقف بر اساس مجموع: پایه + بالاسری + سود + ریسک محاسبه می‌شود.
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* فرم ورودی */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="size-4 text-amber-600" />
                پارامترهای محاسبه
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3">
                <div className="text-[11px] text-muted-foreground">
                  مبلغ پایه (از برگه مالی)
                </div>
                <div className="text-xl font-bold mt-1">
                  {faRial(base)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  معادل {faMoney(base)}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center justify-between">
                  <span>درصد بالاسری (Overhead)</span>
                  <Badge variant="outline" className="text-[10px]">
                    {faPct(overheadPct)}
                  </Badge>
                </Label>
                <Input
                  type="number"
                  value={overheadPct}
                  onChange={(e) => setOverheadPct(Number(e.target.value))}
                  className="h-9 text-xs tabular-nums"
                  min={0}
                  max={50}
                  step={0.5}
                />
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={0.5}
                  value={overheadPct}
                  onChange={(e) => setOverheadPct(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center justify-between">
                  <span>درصد سود پیمانکار</span>
                  <Badge variant="outline" className="text-[10px]">
                    {faPct(profitPct)}
                  </Badge>
                </Label>
                <Input
                  type="number"
                  value={profitPct}
                  onChange={(e) => setProfitPct(Number(e.target.value))}
                  className="h-9 text-xs tabular-nums"
                  min={0}
                  max={30}
                  step={0.5}
                />
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={0.5}
                  value={profitPct}
                  onChange={(e) => setProfitPct(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center justify-between">
                  <span>درصد ضریب ریسک</span>
                  <Badge variant="outline" className="text-[10px]">
                    {faPct(riskPct)}
                  </Badge>
                </Label>
                <Input
                  type="number"
                  value={riskPct}
                  onChange={(e) => setRiskPct(Number(e.target.value))}
                  className="h-9 text-xs tabular-nums"
                  min={0}
                  max={20}
                  step={0.5}
                />
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={0.5}
                  value={riskPct}
                  onChange={(e) => setRiskPct(Number(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">یادداشت</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="توضیحات اختیاری..."
                  className="h-9 text-xs"
                />
              </div>

              <Button
                size="sm"
                className="w-full h-9 bg-amber-600 hover:bg-amber-700"
                disabled={computeMutation.isPending || !base}
                onClick={() => computeMutation.mutate()}
              >
                <Save className="size-4" />
                {computeMutation.isPending
                  ? "در حال محاسبه..."
                  : "محاسبه و ذخیره"}
              </Button>
            </CardContent>
          </Card>

          {/* نتیجه محاسبه */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-600" />
                نتیجه محاسبه
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* سقف قیمت */}
              <div className="rounded-md bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-3 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      سقف قیمت پیشنهادی
                    </div>
                    <div className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">
                      {faMoney(ceilingAmount)}
                    </div>
                  </div>
                  <Badge className="bg-emerald-600">Max</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {faRial(ceilingAmount)}
                </div>
              </div>

              {/* پیشنهاد بهینه */}
              <div className="rounded-md bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-3 border-2 border-amber-300 dark:border-amber-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <Target className="size-3" />
                      پیشنهاد بهینه
                    </div>
                    <div className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-300">
                      {faMoney(suggestedAmount)}
                    </div>
                  </div>
                  <Badge className="bg-amber-600">Optimal</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {faRial(suggestedAmount)} — میانگین کف و سقف
                </div>
              </div>

              {/* کف قیمت */}
              <div className="rounded-md bg-gradient-to-l from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 p-3 border border-rose-200 dark:border-rose-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1">
                      <TrendingDown className="size-3" />
                      کف قانونی (۸٪ پایین‌تر)
                    </div>
                    <div className="text-2xl font-bold mt-1 text-rose-700 dark:text-rose-300">
                      {faMoney(floorAmount)}
                    </div>
                  </div>
                  <Badge className="bg-rose-600">Min</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {faRial(floorAmount)}
                </div>
              </div>

              <Separator className="my-3" />

              {/* تفکیک محاسبه */}
              <div className="text-[11px] font-semibold text-muted-foreground mb-2">
                تفکیک محاسبه سقف قیمت
              </div>
              <div className="space-y-1.5 text-xs">
                <Row label="مبلغ پایه" value={faRial(base)} />
                <Row
                  label={`بالاسری (${faPct(overheadPct)})`}
                  value={`+ ${faRial(overheadAmount)}`}
                  positive
                />
                <Row
                  label={`سود (${faPct(profitPct)})`}
                  value={`+ ${faRial(profitAmount)}`}
                  positive
                />
                <Row
                  label={`ریسک (${faPct(riskPct)})`}
                  value={`+ ${faRial(riskAmount)}`}
                  positive
                />
                <Separator className="my-1" />
                <Row
                  label="جمع (سقف)"
                  value={faRial(ceilingAmount)}
                  bold
                />
              </div>

              {data?.bidRange && (
                <div className="text-[10px] text-muted-foreground pt-2 border-t">
                  آخرین به‌روزرسانی:{" "}
                  {new Date(data.bidRange.id).toLocaleDateString("fa-IR")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  positive,
  bold,
}: {
  label: string;
  value: string;
  positive?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${bold ? "font-bold" : ""} text-muted-foreground`}>
        {label}
      </span>
      <span
        className={`tabular-nums ${bold ? "font-bold" : ""} ${
          positive ? "text-emerald-600" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
