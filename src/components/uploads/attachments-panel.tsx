"use client";

/**
 * AttachmentsPanel — پنل کامل پیوست برای هر سند/موجودیت.
 * فهرست + آپلود امن + حذف، همگی از طریق API محافظت‌شده‌ی /api/uploads.
 * این کامپوننت قابل‌استفاده روی صورت‌وضعیت، تعدیل، متره، مکاتبات و اسناد است.
 */
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Loader2, Paperclip } from "lucide-react";
import { SecureFileUpload, type UploadedAttachment } from "@/components/uploads/secure-file-upload";
import { AttachmentList } from "@/components/uploads/attachment-list";
import { PermissionGate } from "@/components/auth/permission-gate";
import { useToast } from "@/hooks/use-toast";
import { faNum } from "@/lib/fa";

interface AttachmentsPanelProps {
  projectId: string;
  ownerType: string;
  ownerId: string;
  /** آیا کاربر مجوز آپلود دارد؟ (از دسترسی پروژه) */
  canUpload?: boolean;
  visibility?: "PROJECT" | "PARTY" | "INTERNAL";
  accept?: string;
  maxMb?: number;
  title?: string;
}

export function AttachmentsPanel({
  projectId,
  ownerType,
  ownerId,
  canUpload = false,
  visibility = "PROJECT",
  accept,
  maxMb = 500,
  title = "پیوست‌ها و مستندات",
}: AttachmentsPanelProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const queryKey = ["attachments", projectId, ownerType, ownerId];

  const { data, isLoading } = useQuery<{ attachments: UploadedAttachment[] }>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(
        `/api/uploads?projectId=${encodeURIComponent(projectId)}&ownerType=${encodeURIComponent(
          ownerType
        )}&ownerId=${encodeURIComponent(ownerId)}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "خطا در دریافت پیوست‌ها");
      }
      return res.json();
    },
    enabled: !!projectId && !!ownerId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/uploads/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "حذف ناموفق بود");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "پیوست حذف شد" });
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });

  const items = data?.attachments ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <Paperclip className="size-4 text-muted-foreground" />
          {title}
          {items.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
              {faNum(items.length)}
            </span>
          )}
        </h4>
      </div>

      <PermissionGate allowed={canUpload}>
        <SecureFileUpload
          projectId={projectId}
          ownerType={ownerType}
          ownerId={ownerId}
          visibility={visibility}
          accept={accept}
          maxMb={maxMb}
          onUploaded={() => qc.invalidateQueries({ queryKey })}
        />
      </PermissionGate>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> در حال بارگذاری…
        </div>
      ) : (
        <AttachmentList items={items} onDelete={(id) => deleteMutation.mutate(id)} />
      )}
    </div>
  );
}
