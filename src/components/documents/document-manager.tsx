"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Paperclip,
  Upload,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
  X,
  File,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toFa, toJalali } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";

interface DocumentFile {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  projectCode: string;
  paymentPeriod: number | null;
  itemCode: string | null;
  uploadDate: string;
  description: string | null;
  category: string;
  uploadedByName: string | null;
  createdAt: string;
}

const CATEGORIES = [
  { value: "SITE_PHOTO", label: "عکس کارگاه", icon: ImageIcon, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
  { value: "MEETING_MINUTES", label: "صورت‌جلسه", icon: FileText, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" },
  { value: "DRAWING", label: "نقشه", icon: File, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  { value: "INVOICE", label: "فاکتور", icon: FileText, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30" },
  { value: "CONTRACT", label: "قرارداد", icon: FileText, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
  { value: "OTHER", label: "سایر", icon: File, color: "text-slate-600 bg-slate-50 dark:bg-slate-900/30" },
];

interface DocumentManagerProps {
  projectId: string;
  entityType: string;
  entityId: string;
  itemCode?: string;
  paymentPeriod?: number;
  triggerSize?: "sm" | "md";
}

export function DocumentManager({
  projectId,
  entityType,
  entityId,
  itemCode,
  paymentPeriod,
  triggerSize = "sm",
}: DocumentManagerProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SITE_PHOTO");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryKey = ["documents", projectId, entityType, entityId];

  const { data, isLoading } = useQuery<{ documents: DocumentFile[] }>({
    queryKey,
    queryFn: async () => {
      const r = await fetch(
        `/api/documents?projectId=${projectId}&entityType=${entityType}&entityId=${entityId}`
      );
      return r.json();
    },
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) return;
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("projectId", projectId);
      fd.append("entityType", entityType);
      fd.append("entityId", entityId);
      if (itemCode) fd.append("itemCode", itemCode);
      if (paymentPeriod) fd.append("paymentPeriod", String(paymentPeriod));
      if (description) fd.append("description", description);
      fd.append("category", category);
      fd.append("uploadedByName", "سید علی میرجعفری");

      const r = await fetch("/api/documents", {
        method: "POST",
        body: fd,
      });
      if (!r.ok) throw new Error("خطا در آپلود");
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "فایل آپلود شد" });
      setSelectedFile(null);
      setDescription("");
      setUploadOpen(false);
      qc.invalidateQueries({ queryKey });
    },
    onError: () => toast({ title: "خطا در آپلود", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast({ title: "فایل حذف شد" });
    },
  });

  const documents = data?.documents || [];
  const totalCount = documents.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative text-muted-foreground hover:text-amber-600",
            triggerSize === "sm" ? "size-7 p-0" : "size-9 p-0"
          )}
          title="مدیریت مستندات"
        >
          <Paperclip className="size-3.5" />
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -left-0.5 size-3.5 rounded-full bg-amber-500 text-white text-[8px] flex items-center justify-center font-bold">
              {toFa(totalCount)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        className="w-80 sm:w-96 p-0"
        sideOffset={4}
      >
        <div className="border-b p-3 bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Paperclip className="size-4 text-amber-600" />
              <span className="text-xs font-bold">مستندات</span>
              <Badge variant="outline" className="text-[10px] h-5">
                {toFa(totalCount)} فایل
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] gap-1"
              onClick={() => setUploadOpen((v) => !v)}
            >
              <Upload className="size-3" />
              آپلود
            </Button>
          </div>
          {itemCode && (
            <div className="mt-1.5 text-[10px] text-muted-foreground">
              آیتم: <code className="bg-muted px-1 rounded">{itemCode}</code>
            </div>
          )}
        </div>

        {uploadOpen && (
          <div className="border-b p-3 space-y-2 bg-muted/30">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs gap-2 border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              {selectedFile ? selectedFile.name : "انتخاب فایل..."}
            </Button>
            <div>
              <Label className="text-[10px] mb-1 block">دسته‌بندی</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-8 text-xs rounded-md border bg-background px-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات (در نام فایل ذخیره می‌شود)"
              className="h-8 text-xs"
            />
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-2 text-[10px] text-amber-800 dark:text-amber-200">
              <strong>نام فایل هوشمند:</strong>
              <code className="block mt-1 text-[9px] ltr text-left" dir="ltr">
                [کد پروژه]_[شماره SW]_[کد آیتم]_[تاریخ]_[توضیحات].پسوند
              </code>
            </div>
            <Button
              size="sm"
              className="w-full h-9 bg-amber-600 hover:bg-amber-700"
              disabled={!selectedFile || uploadMutation.isPending}
              onClick={() => uploadMutation.mutate()}
            >
              {uploadMutation.isPending ? "در حال آپلود..." : "آپلود فایل"}
            </Button>
          </div>
        )}

        <ScrollArea className="h-64">
          <div className="p-2 space-y-1.5">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-md bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : !documents.length ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Paperclip className="size-8 mx-auto mb-2 text-amber-300" />
                فایلی ثبت نشده
              </div>
            ) : (
              documents.map((doc) => {
                const cat = CATEGORIES.find((c) => c.value === doc.category) || CATEGORIES[5];
                const Icon = cat.icon;
                return (
                  <div
                    key={doc.id}
                    className="flex items-start gap-2 p-2 rounded-md border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0", cat.color)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" title={doc.originalName}>
                        {doc.originalName}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate" dir="ltr">
                        {doc.storedName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[9px] h-4">
                          {cat.label}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">
                          {formatSize(doc.sizeBytes)}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          • {toJalali(doc.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <a
                        href={`/uploads/${doc.storedName}`}
                        download={doc.storedName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="size-6 flex items-center justify-center rounded hover:bg-muted text-amber-600"
                        title="دانلود"
                      >
                        <Download className="size-3" />
                      </a>
                      <button
                        onClick={() => {
                          if (confirm("حذف فایل؟")) deleteMutation.mutate(doc.id);
                        }}
                        className="size-6 flex items-center justify-center rounded hover:bg-muted text-rose-500"
                        title="حذف"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${toFa(bytes)} B`;
  if (bytes < 1024 * 1024) return `${toFa((bytes / 1024).toFixed(1))} KB`;
  return `${toFa((bytes / (1024 * 1024)).toFixed(1))} MB`;
}
