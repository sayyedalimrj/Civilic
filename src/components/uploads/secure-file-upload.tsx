"use client";

/**
 * SecureFileUpload — آپلود امن فایل به /api/uploads
 *  - انتخاب یا کشیدن‌و‌رها کردن فایل
 *  - اعتبارسنجی اولیه‌ی حجم سمت کلاینت (سرور دوباره بررسی می‌کند)
 *  - نمایش نوار پیشرفت با XMLHttpRequest
 */
import { useRef, useState, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export interface UploadedAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  visibility: string;
  uploadedByName: string | null;
  createdAt: string;
  canDelete: boolean;
  downloadUrl: string;
}

interface SecureFileUploadProps {
  projectId: string;
  ownerType: string;
  ownerId: string;
  visibility?: "PROJECT" | "PARTY" | "INTERNAL";
  accept?: string;
  maxMb?: number;
  disabled?: boolean;
  onUploaded?: (att: UploadedAttachment) => void;
}

export function SecureFileUpload({
  projectId,
  ownerType,
  ownerId,
  visibility = "PROJECT",
  accept,
  maxMb = 500,
  disabled = false,
  onUploaded,
}: SecureFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const doUpload = useCallback(
    (file: File) => {
      if (file.size > maxMb * 1024 * 1024) {
        toast({ title: "فایل بزرگ است", description: `حداکثر حجم مجاز ${maxMb} مگابایت است`, variant: "destructive" });
        return;
      }
      const form = new FormData();
      form.append("file", file);
      form.append("projectId", projectId);
      form.append("ownerType", ownerType);
      form.append("ownerId", ownerId);
      form.append("visibility", visibility);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/uploads");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onloadstart = () => {
        setBusy(true);
        setProgress(0);
      };
      xhr.onload = () => {
        setBusy(false);
        setProgress(0);
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && res.attachment) {
            toast({ title: "آپلود شد", description: file.name });
            onUploaded?.(res.attachment);
          } else {
            toast({ title: "خطا در آپلود", description: res.error || "خطای ناشناخته", variant: "destructive" });
          }
        } catch {
          toast({ title: "خطا در آپلود", description: "پاسخ نامعتبر از سرور", variant: "destructive" });
        }
      };
      xhr.onerror = () => {
        setBusy(false);
        setProgress(0);
        toast({ title: "خطا در ارتباط", description: "ارسال فایل ناموفق بود", variant: "destructive" });
      };
      xhr.send(form);
    },
    [projectId, ownerType, ownerId, visibility, maxMb, onUploaded, toast]
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !busy) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (disabled || busy) return;
        const file = e.dataTransfer.files?.[0];
        if (file) doUpload(file);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors",
        dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        (disabled || busy) && "opacity-60"
      )}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onPick} disabled={disabled || busy} />
      {busy ? (
        <>
          <Loader2 className="size-6 animate-spin text-primary" />
          <div className="w-full max-w-[220px]">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">در حال آپلود… {progress}٪</p>
          </div>
        </>
      ) : (
        <>
          <Upload className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">فایل را اینجا رها کنید یا انتخاب کنید</p>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
            انتخاب فایل
          </Button>
          <p className="text-[11px] text-muted-foreground/70">حداکثر {maxMb} مگابایت</p>
        </>
      )}
    </div>
  );
}
