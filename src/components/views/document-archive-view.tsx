"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  FolderOpen, FileText, Image as ImageIcon, Download, Search,
  HardHat, FileSpreadsheet, FileBarChart, Calendar, Filter,
  Star, GitBranch, Tag, Eye, X, Upload, TrendingUp,
} from "lucide-react";
import { toFa, toJalali } from "@/lib/fa";
import { exportToExcel } from "@/lib/export/export-utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "ALL", label: "همه" },
  { value: "SITE_PHOTO", label: "عکس کارگاه", icon: ImageIcon, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40" },
  { value: "MEETING_MINUTES", label: "صورت‌جلسه", icon: FileText, color: "text-amber-600 bg-amber-100 dark:bg-amber-950/40" },
  { value: "DRAWING", label: "نقشه", icon: FileSpreadsheet, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/40" },
  { value: "INVOICE", label: "فاکتور", icon: FileBarChart, color: "text-orange-600 bg-orange-100 dark:bg-orange-950/40" },
  { value: "CONTRACT", label: "قرارداد", icon: FileText, color: "text-purple-600 bg-purple-100 dark:bg-purple-950/40" },
  { value: "OTHER", label: "سایر", icon: FileText, color: "text-slate-600 bg-slate-100 dark:bg-slate-900/40" },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${toFa(bytes)} B`;
  if (bytes < 1024 * 1024) return `${toFa((bytes / 1024).toFixed(1))} KB`;
  return `${toFa((bytes / (1024 * 1024)).toFixed(1))} MB`;
}

export function DocumentArchiveView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [starredOnly, setStarredOnly] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [versionsDoc, setVersionsDoc] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["doc-archive", category],
    queryFn: async () => {
      const params = category !== "ALL" ? `?category=${category}` : "";
      const r = await fetch(`/api/documents/archive${params}`);
      return r.json();
    },
  });

  const starMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/documents/${id}/star`, { method: "PATCH" });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-archive"] });
      toast({ title: "وضعیت ستاره تغییر کرد" });
    },
  });

  const { data: versionsData, isLoading: versionsLoading } = useQuery({
    queryKey: ["doc-versions", versionsDoc?.id],
    queryFn: async () => {
      const r = await fetch(`/api/documents/${versionsDoc.id}/versions`);
      return r.json();
    },
    enabled: !!versionsDoc,
  });

  const documents = data?.documents || [];
  const summary = data?.summary;

  // فیلتر جستجو + starred
  const filteredDocs = documents.filter((d: any) =>
    (!search ||
      d.originalName?.includes(search) ||
      d.storedName?.includes(search) ||
      d.description?.includes(search)) &&
    (!starredOnly || d.isStarred)
  );

  const handleExport = () => {
    exportToExcel(`document-archive-${new Date().toISOString().split("T")[0]}`, [
      {
        name: "مستندات",
        title: "سیوان تدبیر تجارت — آرشیو مستندات",
        subtitle: `تاریخ تولید: ${new Date().toLocaleDateString("fa-IR")} — تعداد: ${filteredDocs.length}`,
        headers: ["نام فایل", "نام ذخیره‌شده", "دسته", "پروژه", "حجم (B)", "نسخه", "ستاره‌دار", "تاریخ", "آپلودکننده"],
        rows: filteredDocs.map((d: any) => [
          d.originalName, d.storedName, d.category,
          d.project?.name || "—", d.sizeBytes, d.version || 1,
          d.isStarred ? "بله" : "خیر", toJalali(d.createdAt), d.uploadedByName || "—",
        ]),
      },
    ]);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FolderOpen className="size-6 text-amber-600" />
            آرشیو مستندات
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            مرکز مدیریت و جستجوی تمام فایل‌های آپلودشده در پروژه‌ها
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExport}>
            <Download className="size-4" />
            خروجی Excel
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard icon={FolderOpen} label="کل فایل‌ها" value={summary ? toFa(summary.total) : "—"} sub="مستندات" color="amber" />
        <KPICard icon={FileText} label="حجم کل" value={summary ? formatSize(summary.totalSize) : "—"} sub="فضای اشغالی" color="orange" />
        <KPICard icon={ImageIcon} label="دسته‌بندی‌ها" value={summary ? toFa(Object.keys(summary.byCategory).length) : "—"} sub="نوع فایل" color="emerald" />
        <KPICard icon={Calendar} label="آخرین آپلود" value={documents[0] ? toJalali(documents[0].createdAt) : "—"} sub="تاریخ" color="slate" />
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              فیلتر:
            </div>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1",
                  category === c.value ? "bg-amber-600 text-white" : "bg-card border hover:bg-muted/50"
                )}
              >
                {c.icon && <c.icon className="size-3" />}
                {c.label}
                {c.value !== "ALL" && summary?.byCategory[c.value] && (
                  <span className="text-[9px] opacity-70">({toFa(summary.byCategory[c.value].count)})</span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو در نام فایل، شرح..."
                className="h-8 pr-7 text-xs"
              />
            </div>
            <Button
              variant={starredOnly ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1 text-xs shrink-0"
              onClick={() => setStarredOnly(!starredOnly)}
            >
              <Star className={cn("size-3.5", starredOnly && "fill-current")} />
              ستاره‌دار
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : !filteredDocs.length ? (
        <Card><CardContent className="p-12 text-center text-xs text-muted-foreground">
          <FolderOpen className="size-10 mx-auto mb-2 text-amber-300" />
          مستندی یافت نشده
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDocs.map((doc: any) => {
            const cat = CATEGORIES.find((c) => c.value === doc.category) || CATEGORIES[6];
            const CatIcon = cat.icon || FileText;
            return (
              <Card key={doc.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className={cn("size-9 rounded-lg flex items-center justify-center shrink-0", cat.color)}>
                      <CatIcon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate" title={doc.originalName}>
                        {doc.originalName}
                      </div>
                      <div className="text-[9px] text-muted-foreground font-mono truncate ltr text-left" dir="ltr">
                        {doc.storedName}
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[8px] h-3.5">
                          {cat.label}
                        </Badge>
                        {doc.project?.name && (
                          <Badge variant="outline" className="text-[8px] h-3.5 text-amber-600">
                            {doc.project.name.length > 12 ? doc.project.name.slice(0, 12) + "…" : doc.project.name}
                          </Badge>
                        )}
                        <span className="text-[9px] text-muted-foreground">{formatSize(doc.sizeBytes)}</span>
                      </div>
                      {doc.description && (
                        <div className="text-[10px] text-muted-foreground mt-1 truncate">
                          {doc.description}
                        </div>
                      )}
                      {(doc.version > 1 || doc.isStarred) && (
                        <div className="flex items-center gap-1 mt-1">
                          {doc.version > 1 && (
                            <Badge variant="outline" className="text-[8px] h-3.5 gap-0.5">
                              <GitBranch className="size-2" />
                              v{toFa(doc.version)}
                            </Badge>
                          )}
                          {doc.isStarred && (
                            <Badge className="text-[8px] h-3.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                              <Star className="size-2 fill-current" />
                              محبوب
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[9px] text-muted-foreground">
                          {toJalali(doc.createdAt)}
                        </span>
                        {doc.uploadedByName && (
                          <span className="text-[9px] text-muted-foreground">
                            {doc.uploadedByName}
                          </span>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="mt-2 flex items-center gap-1">
                        <a
                          href={`/uploads/${doc.storedName}`}
                          download={doc.storedName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 h-7 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-[11px] font-medium transition-colors"
                        >
                          <Download className="size-3" />
                          دانلود
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("size-7 p-0", doc.isStarred ? "text-amber-500" : "text-muted-foreground hover:text-amber-500")}
                          onClick={() => starMutation.mutate(doc.id)}
                        >
                          <Star className={cn("size-3.5", doc.isStarred && "fill-current")} />
                        </Button>
                        {doc.mimeType?.startsWith("image/") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-7 p-0 text-muted-foreground hover:text-cyan-500"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0 text-muted-foreground hover:text-purple-500"
                          onClick={() => setVersionsDoc(doc)}
                        >
                          <GitBranch className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-4 text-cyan-600" />
              پیش‌نمایش تصویر
            </DialogTitle>
            <DialogDescription>{previewDoc?.originalName}</DialogDescription>
          </DialogHeader>
          {previewDoc && (
            <div className="space-y-3">
              <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4 max-h-[60vh] overflow-hidden">
                <img
                  src={`/uploads/${previewDoc.storedName}`}
                  alt={previewDoc.originalName}
                  className="max-w-full max-h-[50vh] object-contain rounded-md"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "block";
                  }}
                />
                <div style={{ display: "none" }} className="text-center text-xs text-muted-foreground py-8">
                  <ImageIcon className="size-12 mx-auto mb-2 text-muted-foreground/40" />
                  پیش‌نمایش در دسترس نیست
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">نام هوشمند:</span>
                  <div className="font-mono text-[10px] mt-0.5" dir="ltr">{previewDoc.storedName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">حجم:</span>
                  <span className="font-medium mr-1">{formatSize(previewDoc.sizeBytes)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">پروژه:</span>
                  <span className="font-medium mr-1">{previewDoc.project?.name || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">آپلودکننده:</span>
                  <span className="font-medium mr-1">{previewDoc.uploadedByName || "—"}</span>
                </div>
              </div>
              <a
                href={`/uploads/${previewDoc.storedName}`}
                download={previewDoc.storedName}
                className="flex items-center justify-center gap-1 h-9 rounded-md bg-amber-600 text-white hover:bg-amber-700 text-xs font-medium transition-colors"
              >
                <Download className="size-4" />
                دانلود فایل
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Versions Dialog */}
      <Dialog open={!!versionsDoc} onOpenChange={(o) => !o && setVersionsDoc(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="size-4 text-purple-600" />
              نسخه‌های مستند
            </DialogTitle>
            <DialogDescription>{versionsDoc?.originalName}</DialogDescription>
          </DialogHeader>
          {versionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {(versionsData?.versions || []).map((v: any) => (
                <div
                  key={v.id}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-md border",
                    v.id === versionsData?.current
                      ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300"
                      : "hover:bg-muted/30"
                  )}
                >
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    v.isLatest
                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  )}>
                    v{toFa(v.version)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{v.originalName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {toJalali(v.createdAt)} • {formatSize(v.sizeBytes)}
                      {v.isLatest && <span className="text-emerald-600 mr-1">• آخرین نسخه</span>}
                      {v.id === versionsData?.current && <span className="text-amber-600 mr-1">• فعلی</span>}
                    </div>
                  </div>
                  <a
                    href={`/uploads/${v.storedName}`}
                    download={v.storedName}
                    className="size-7 flex items-center justify-center rounded-md hover:bg-muted text-amber-600"
                  >
                    <Download className="size-3.5" />
                  </a>
                </div>
              ))}
              {(!versionsData?.versions || versionsData.versions.length === 0) && (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <GitBranch className="size-8 mx-auto mb-2 text-purple-300" />
                  نسخه‌ای موجود نیست
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, sub, color }: {
  icon: typeof FolderOpen; label: string; value: string; sub: string;
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
        <div className="text-base font-bold tabular-nums">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</div>
      </CardContent>
    </Card>
  );
}
