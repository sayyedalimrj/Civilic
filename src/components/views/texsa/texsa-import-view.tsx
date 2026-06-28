"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  UploadCloud, CheckCircle2, AlertCircle, X,
  Database, ChevronLeft, FileArchive, Building2, Users,
  Calendar, DollarSign, ChevronDown, ChevronUp,
} from "lucide-react";
import { toFa } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface PreviewData {
  fileName: string;
  fileSize: number;
  totalTables: number;
  totalRows: number;
  tableCounts: Record<string, number>;
  projectInfo: {
    projectName: string;
    projectCode: string;
    employer: string;
    contractor: string;
    consultant: string;
    year: string;
    contractAmount: string;
    version: string;
    location: string;
  };
  unknownTables: string[];
  warnings: string[];
  knownTablesCount: number;
}

interface ImportResult {
  importId: string;
  status: string;
  totalTables: number;
  totalRows: number;
  projectInfo: any;
}

type Step = 1 | 2 | 3;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${toFa(Math.round(bytes / 1024))} KB`;
  return `${toFa((bytes / (1024 * 1024)).toFixed(1))} MB`;
}

export function TexsaImportView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { setView } = useAppStore();
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      setProgress(30);
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/texsa/import/preview", { method: "POST", body: fd });
      setProgress(100);
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "خطا در بررسی فایل");
      }
      return r.json();
    },
    onSuccess: (data: PreviewData) => {
      setPreview(data);
      setStep(2);
      setProgress(0);
    },
    onError: (err: Error) => {
      setError(err.message);
      setProgress(0);
    },
  });

  const commitMutation = useMutation({
    mutationFn: async (file: File) => {
      setProgress(10);
      const fd = new FormData();
      fd.append("file", file);
      setProgress(40);
      const r = await fetch("/api/texsa/import/commit", { method: "POST", body: fd });
      setProgress(90);
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error || "خطا در ذخیره");
      }
      setProgress(100);
      return r.json();
    },
    onSuccess: (data: ImportResult) => {
      setImportResult(data);
      setStep(3);
      setProgress(0);
      toast({ title: `ایمپورت کامل شد — ${toFa(data.totalRows)} ردیف` });
      qc.invalidateQueries({ queryKey: ["texsa-imports"] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setProgress(0);
    },
  });

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setError("");
    setPreview(null);
    setImportResult(null);
    previewMutation.mutate(f);
  }, [previewMutation]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleReset = () => {
    setStep(1);
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setError("");
    setProgress(0);
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <UploadCloud className="size-6 text-amber-600" />
          وارد کردن فایل تکسا
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          فایل .svzt تکسا را وارد کنید تا تمام داده‌های پروژه بارگذاری شود
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "انتخاب فایل" },
          { n: 2, label: "بررسی فایل" },
          { n: 3, label: "پایان" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={cn(
              "flex size-7 items-center justify-center rounded-full text-xs font-bold",
              step >= s.n ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"
            )}>
              {step > s.n ? <CheckCircle2 className="size-4" /> : toFa(s.n)}
            </div>
            <span className={cn(
              "text-xs",
              step >= s.n ? "font-medium text-foreground" : "text-muted-foreground"
            )}>
              {s.label}
            </span>
            {i < 2 && <div className="w-8 h-px bg-muted mx-1" />}
          </div>
        ))}
      </div>

      {/* Progress */}
      {progress > 0 && (
        <div className="flex items-center gap-3">
          <Progress value={progress} className="h-1.5" />
          <span className="text-xs text-muted-foreground tabular-nums">{toFa(progress)}٪</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-rose-300 bg-rose-50/50 dark:bg-rose-950/20">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertCircle className="size-5 text-rose-500 shrink-0" />
            <span className="text-sm text-rose-700 dark:text-rose-300 flex-1">{error}</span>
            <Button size="sm" variant="ghost" onClick={handleReset}>تلاش مجدد</Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: File selection */}
      {step === 1 && !error && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
            dragOver
              ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
              : "border-muted-foreground/30 hover:border-amber-400 hover:bg-muted/30"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".svzt,.xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <UploadCloud className="size-14 mx-auto mb-3 text-amber-400" />
          <div className="text-base font-bold mb-1">فایل .svzt تکسا را اینجا بکشید</div>
          <div className="text-xs text-muted-foreground">یا کلیک کنید</div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && preview && (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <FileArchive className="size-5 text-amber-600" />
            <div className="flex-1">
              <div className="text-sm font-medium">{preview.fileName}</div>
              <div className="text-[10px] text-muted-foreground">
                {formatSize(preview.fileSize)} • {toFa(preview.totalTables)} جدول • {toFa(preview.totalRows)} ردیف
              </div>
            </div>
            <Button size="sm" variant="ghost" className="size-7 p-0" onClick={handleReset}>
              <X className="size-4" />
            </Button>
          </div>

          {/* Project info */}
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={Building2} label="نام پروژه" value={preview.projectInfo.projectName} />
            <InfoRow icon={Database} label="کد پروژه" value={preview.projectInfo.projectCode} />
            <InfoRow icon={Users} label="کارفرما" value={preview.projectInfo.employer} />
            <InfoRow icon={Users} label="پیمانکار" value={preview.projectInfo.contractor} />
            <InfoRow icon={Users} label="مشاور/ناظر" value={preview.projectInfo.consultant} />
            <InfoRow icon={Calendar} label="سال فهرست‌بها" value={preview.projectInfo.year} />
            <InfoRow icon={DollarSign} label="مبلغ پیمان" value={preview.projectInfo.contractAmount} />
            <InfoRow icon={Database} label="کل ردیف‌ها" value={toFa(preview.totalRows)} />
          </div>

          {/* Warnings */}
          {preview.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
              <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">هشدارها:</div>
              {preview.warnings.map((w, i) => (
                <div key={i} className="text-[11px] text-amber-900 dark:text-amber-200">• {w}</div>
              ))}
            </div>
          )}

          {/* Technical details accordion */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between p-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <span>جزئیات فنی ({toFa(preview.totalTables)} جدول)</span>
            {showDetails ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {showDetails && (
            <div className="max-h-48 overflow-y-auto rounded-lg border p-2">
              <table className="w-full text-[11px]">
                <tbody>
                  {Object.entries(preview.tableCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, count]) => (
                      <tr key={name} className="border-b last:border-0">
                        <td className="py-1 px-2 font-mono">{name}</td>
                        <td className="py-1 px-2 text-left tabular-nums">{toFa(count)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={handleReset}>
              <ChevronLeft className="size-4" />
              بازگشت
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 gap-2"
              onClick={() => file && commitMutation.mutate(file)}
              disabled={commitMutation.isPending}
            >
              <Database className="size-4" />
              ورود کامل اطلاعات
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && importResult && (
        <Card className="border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="size-14 mx-auto mb-3 text-emerald-500" />
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-300 mb-1">
              ایمپورت با موفقیت انجام شد
            </div>
            <div className="text-xs text-muted-foreground mb-4">
              {toFa(importResult.totalRows)} ردیف در {toFa(importResult.totalTables)} جدول ذخیره شد
            </div>
            <Button
              className="bg-amber-600 hover:bg-amber-700 gap-2"
              onClick={() => setView("projects")}
            >
              <Building2 className="size-4" />
              باز کردن پروژه
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: {
  icon: typeof Building2; label: string; value: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border">
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-muted-foreground">{label}</div>
        <div className="text-xs font-medium truncate">{value || "—"}</div>
      </div>
    </div>
  );
}
