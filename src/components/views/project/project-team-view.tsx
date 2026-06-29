"use client";

/**
 * ProjectTeamView — مدیریت طرف‌ها و اعضای پروژه.
 *  - فهرست/افزودن طرف‌های پروژه (کارفرما/مشاور/پیمانکار/آزمایشگاه/…)
 *  - فهرست/افزودن/ویرایش/حذف اعضای پروژه با نقش پروژه‌ای
 * همه‌ی اقدامات سمت‌سرور permission-checked هستند؛ این UI فقط دکمه‌ها را gate می‌کند.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Building2, Plus, Pencil, Trash2, ShieldCheck, PenLine, UserX, Loader2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useProjectAccess } from "@/hooks/use-project-access";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

// ─── types ───
interface PartyRow {
  id: string;
  partyType: string;
  displayTitle: string;
  isPrimary: boolean;
  organization: { id: string; name: string; type: string } | null;
  _count?: { members: number };
}
interface MemberRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  userActive: boolean;
  role: string;
  roleLabel: string;
  partyType: string | null;
  partyTitle: string | null;
  canSign: boolean;
  canApprove: boolean;
  isActive: boolean;
}
interface RoleOption { key: string; label: string; partyType: string }
interface PartyOption { type: string; label: string }

const PARTY_COLOR: Record<string, string> = {
  EMPLOYER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  CONSULTANT: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  CONTRACTOR: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
};
function partyColor(t: string | null) {
  return (t && PARTY_COLOR[t]) || "bg-muted text-muted-foreground";
}

export function ProjectTeamView() {
  const projectId = useAppStore((s) => s.selectedProjectId);
  const { can } = useProjectAccess(projectId);
  const canManage = can("members.edit") || can("members.invite");

  const [partyDialog, setPartyDialog] = useState(false);
  const [memberDialog, setMemberDialog] = useState(false);
  const [editMember, setEditMember] = useState<MemberRow | null>(null);

  const partiesQ = useQuery<{ parties: PartyRow[] }>({
    queryKey: ["project-parties", projectId],
    queryFn: async () => (await fetch(`/api/projects/${projectId}/parties`)).json(),
    enabled: !!projectId,
  });
  const membersQ = useQuery<{ members: MemberRow[] }>({
    queryKey: ["project-members", projectId],
    queryFn: async () => (await fetch(`/api/projects/${projectId}/members`)).json(),
    enabled: !!projectId,
  });

  if (!projectId) return null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* طرف‌های پروژه */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Building2 className="size-5 text-muted-foreground" /> طرف‌های پروژه
          </h3>
          {canManage && (
            <Button size="sm" onClick={() => setPartyDialog(true)}>
              <Plus className="ml-1 size-4" /> افزودن طرف
            </Button>
          )}
        </div>
        {partiesQ.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (partiesQ.data?.parties?.length ?? 0) === 0 ? (
          <EmptyHint text="هنوز طرفی به این پروژه افزوده نشده است." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {partiesQ.data!.parties.map((p) => (
              <div key={p.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between">
                  <Badge className={partyColor(p.partyType)}>{p.partyType}</Badge>
                  {p.isPrimary && <span className="text-[11px] text-muted-foreground">اصلی</span>}
                </div>
                <p className="mt-2 truncate font-medium" title={p.displayTitle}>{p.displayTitle}</p>
                <p className="truncate text-xs text-muted-foreground">{p.organization?.name ?? "—"}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {(p._count?.members ?? 0).toLocaleString("fa-IR")} عضو
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* اعضای پروژه */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Users className="size-5 text-muted-foreground" /> اعضای پروژه
          </h3>
          {canManage && (
            <Button
              size="sm"
              disabled={(partiesQ.data?.parties?.length ?? 0) === 0}
              onClick={() => { setEditMember(null); setMemberDialog(true); }}
            >
              <Plus className="ml-1 size-4" /> افزودن عضو
            </Button>
          )}
        </div>
        {membersQ.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (membersQ.data?.members?.length ?? 0) === 0 ? (
          <EmptyHint text="هنوز عضوی به این پروژه افزوده نشده است." />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 text-right font-medium">کاربر</th>
                  <th className="p-2 text-right font-medium">طرف</th>
                  <th className="p-2 text-right font-medium">نقش</th>
                  <th className="p-2 text-center font-medium">امضا/تأیید</th>
                  <th className="p-2 text-center font-medium">وضعیت</th>
                  {canManage && <th className="p-2 text-center font-medium">اقدام</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {membersQ.data!.members.map((m) => (
                  <tr key={m.id} className={m.isActive ? "" : "opacity-50"}>
                    <td className="p-2">
                      <div className="font-medium">{m.userName}</div>
                      <div className="text-[11px] text-muted-foreground">{m.userEmail ?? "—"}</div>
                    </td>
                    <td className="p-2">
                      <Badge className={partyColor(m.partyType)} variant="secondary">
                        {m.partyTitle ?? m.partyType ?? "—"}
                      </Badge>
                    </td>
                    <td className="p-2">{m.roleLabel}</td>
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        {m.canSign && <PenLine className="size-4 text-blue-600" aria-label="امضاکننده" />}
                        {m.canApprove && <ShieldCheck className="size-4 text-emerald-600" aria-label="تأییدکننده" />}
                        {!m.canSign && !m.canApprove && <span className="text-[11px]">—</span>}
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      {m.isActive
                        ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">فعال</Badge>
                        : <Badge variant="secondary">غیرفعال</Badge>}
                    </td>
                    {canManage && (
                      <td className="p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="size-8" title="ویرایش"
                            onClick={() => { setEditMember(m); setMemberDialog(true); }}>
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {partyDialog && (
        <AddPartyDialog projectId={projectId} onClose={() => setPartyDialog(false)} />
      )}
      {memberDialog && (
        <MemberDialog
          projectId={projectId}
          parties={partiesQ.data?.parties ?? []}
          existing={editMember}
          canDisable={can("members.disable")}
          onClose={() => { setMemberDialog(false); setEditMember(null); }}
        />
      )}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">{text}</div>
  );
}

// ─── افزودن طرف ───
function AddPartyDialog({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [partyType, setPartyType] = useState("CONTRACTOR");
  const [orgMode, setOrgMode] = useState<"existing" | "new">("existing");
  const [organizationId, setOrganizationId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [displayTitle, setDisplayTitle] = useState("");

  const metaQ = useQuery<{ parties: PartyOption[] }>({
    queryKey: ["meta-roles"],
    queryFn: async () => (await fetch("/api/meta/roles")).json(),
  });
  const orgsQ = useQuery<{ organizations: { id: string; name: string; type: string }[] }>({
    queryKey: ["organizations"],
    queryFn: async () => (await fetch("/api/organizations")).json(),
  });

  const mut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { partyType, displayTitle: displayTitle || undefined };
      if (orgMode === "existing") body.organizationId = organizationId;
      else body.organizationName = organizationName;
      const r = await fetch(`/api/projects/${projectId}/parties`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "خطا در افزودن طرف");
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "طرف افزوده شد" });
      qc.invalidateQueries({ queryKey: ["project-parties", projectId] });
      onClose();
    },
    onError: (e: Error) => toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });

  const valid = orgMode === "existing" ? !!organizationId : organizationName.trim().length > 1;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>افزودن طرف به پروژه</DialogTitle>
          <DialogDescription>نوع طرف و سازمان مربوطه را مشخص کنید.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">نوع طرف</Label>
            <Select value={partyType} onValueChange={setPartyType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(metaQ.data?.parties ?? []).map((p) => (
                  <SelectItem key={p.type} value={p.type}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="button" size="sm" variant={orgMode === "existing" ? "default" : "outline"} onClick={() => setOrgMode("existing")}>سازمان موجود</Button>
            <Button type="button" size="sm" variant={orgMode === "new" ? "default" : "outline"} onClick={() => setOrgMode("new")}>سازمان جدید</Button>
          </div>

          {orgMode === "existing" ? (
            <div className="space-y-1.5">
              <Label className="text-xs">انتخاب سازمان</Label>
              <Select value={organizationId} onValueChange={setOrganizationId}>
                <SelectTrigger><SelectValue placeholder="یک سازمان انتخاب کنید" /></SelectTrigger>
                <SelectContent>
                  {(orgsQ.data?.organizations ?? []).map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs">نام سازمان جدید</Label>
              <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="مثلاً: شرکت مهندسین مشاور …" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">عنوان نمایشی (اختیاری)</Label>
            <Input value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)} placeholder="مثلاً: پیمانکار اصلی" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>انصراف</Button>
          <Button onClick={() => mut.mutate()} disabled={!valid || mut.isPending}>
            {mut.isPending && <Loader2 className="ml-1 size-4 animate-spin" />} افزودن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── افزودن/ویرایش عضو ───
function MemberDialog({
  projectId, parties, existing, canDisable, onClose,
}: {
  projectId: string;
  parties: PartyRow[];
  existing: MemberRow | null;
  canDisable: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const isEdit = !!existing;

  const [userId, setUserId] = useState(existing?.userId ?? "");
  const [projectPartyId, setProjectPartyId] = useState("");
  const [role, setRole] = useState(existing?.role ?? "");
  const [canSign, setCanSign] = useState(existing?.canSign ?? false);
  const [canApprove, setCanApprove] = useState(existing?.canApprove ?? false);
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);

  const metaQ = useQuery<{ roles: RoleOption[] }>({
    queryKey: ["meta-roles"],
    queryFn: async () => (await fetch("/api/meta/roles")).json(),
  });
  const usersQ = useQuery<{ users: { id: string; name: string; email: string }[] }>({
    queryKey: ["users"],
    queryFn: async () => (await fetch("/api/users")).json(),
    enabled: !isEdit,
  });

  // نقش‌ها بر اساس نوع طرفِ انتخاب‌شده فیلتر می‌شوند
  const selectedParty = parties.find((p) => p.id === projectPartyId);
  const roleOptions = (metaQ.data?.roles ?? []).filter(
    (r) => !selectedParty || r.partyType === selectedParty.partyType
  );

  const save = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        const r = await fetch(`/api/projects/${projectId}/members/${existing!.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, canSign, canApprove, isActive }),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "خطا در ویرایش عضو");
        return r.json();
      }
      const r = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, projectPartyId, role, canSign, canApprove }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "خطا در افزودن عضو");
      return r.json();
    },
    onSuccess: () => {
      toast({ title: isEdit ? "عضو به‌روزرسانی شد" : "عضو افزوده شد" });
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
      qc.invalidateQueries({ queryKey: ["project-parties", projectId] });
      onClose();
    },
    onError: (e: Error) => toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/members/${existing!.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "خطا در حذف عضو");
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "عضو حذف شد" });
      qc.invalidateQueries({ queryKey: ["project-members", projectId] });
      qc.invalidateQueries({ queryKey: ["project-parties", projectId] });
      onClose();
    },
    onError: (e: Error) => toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });

  const valid = isEdit ? !!role : !!userId && !!projectPartyId && !!role;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `ویرایش عضو: ${existing!.userName}` : "افزودن عضو به پروژه"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "نقش، اختیارات و وضعیت عضو را تغییر دهید." : "کاربر، طرف و نقش پروژه‌ای را انتخاب کنید."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">کاربر</Label>
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger><SelectValue placeholder="یک کاربر انتخاب کنید" /></SelectTrigger>
                  <SelectContent>
                    {(usersQ.data?.users ?? []).map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name} — {u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">طرف پروژه</Label>
                <Select value={projectPartyId} onValueChange={(v) => { setProjectPartyId(v); setRole(""); }}>
                  <SelectTrigger><SelectValue placeholder="انتخاب طرف" /></SelectTrigger>
                  <SelectContent>
                    {parties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.displayTitle} ({p.partyType})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">نقش پروژه‌ای</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="انتخاب نقش" /></SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={canSign} onCheckedChange={setCanSign} /> امضاکننده
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={canApprove} onCheckedChange={setCanApprove} /> تأییدکننده نهایی
            </label>
            {isEdit && (
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={isActive} onCheckedChange={setIsActive} /> فعال
              </label>
            )}
          </div>
        </div>
        <DialogFooter className="flex-row-reverse justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>انصراف</Button>
            <Button onClick={() => save.mutate()} disabled={!valid || save.isPending}>
              {save.isPending && <Loader2 className="ml-1 size-4 animate-spin" />}
              {isEdit ? "ذخیره" : "افزودن"}
            </Button>
          </div>
          {isEdit && canDisable && (
            <Button variant="outline" className="text-destructive hover:text-destructive"
              onClick={() => remove.mutate()} disabled={remove.isPending}>
              <UserX className="ml-1 size-4" /> حذف عضو
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
