"use client";

/**
 * AttachmentList — نمایش فهرست پیوست‌ها با دکمه‌ی دانلود و حذف.
 * دانلود از مسیر محافظت‌شده‌ی /api/uploads/[id]/download انجام می‌شود.
 */
import { Download, Trash2, FileText, Paperclip, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { faNum, toJalali } from "@/lib/fa";
import type { UploadedAttachment } from "@/components/uploads/secure-file-upload";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${faNum(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${faNum(bytes / 1024, 1)} کیلوبایت`;
  return `${faNum(bytes / (1024 * 1024), 1)} مگابایت`;
}

const VISIBILITY_LABEL: Record<string, string> = {
  PROJECT: "همه‌ی اعضای پروژه",
  PARTY: "فقط طرف من",
  INTERNAL: "داخلی",
};

interface AttachmentListProps {
  items: UploadedAttachment[];
  onDelete?: (id: string) => void;
  emptyText?: string;
}

export function AttachmentList({ items, onDelete, emptyText = "هنوز پیوستی اضافه نشده است" }: AttachmentListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-6 text-center text-sm text-muted-foreground">
        <Paperclip className="size-5 opacity-50" />
        {emptyText}
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {items.map((a) => (
        <li key={a.id} className="flex items-center gap-3 px-3 py-2.5">
          <FileText className="size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" title={a.originalName}>
              {a.originalName}
            </p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              <span>{formatBytes(a.sizeBytes)}</span>
              <span>•</span>
              <span>{a.uploadedByName || "نامشخص"}</span>
              <span>•</span>
              <span>{toJalali(a.createdAt)}</span>
              {a.visibility !== "PROJECT" && (
                <span className="inline-flex items-center gap-0.5 text-amber-600">
                  <Lock className="size-3" />
                  {VISIBILITY_LABEL[a.visibility] ?? a.visibility}
                </span>
              )}
            </p>
          </div>
          <a href={a.downloadUrl} download>
            <Button type="button" variant="ghost" size="icon" className="size-8" title="دانلود">
              <Download className="size-4" />
            </Button>
          </a>
          {a.canDelete && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              title="حذف"
              onClick={() => onDelete(a.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
