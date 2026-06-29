"use client";

/**
 * useProjectAccess — دسترسی کاربر فعلی در یک پروژه (برای permission-aware UI).
 * منبع حقیقت همچنان سرور است؛ این فقط برای نمایش/مخفی‌سازی UI است.
 */
import { useQuery } from "@tanstack/react-query";

export interface ProjectAccessInfo {
  isMember: boolean;
  userId?: string;
  role?: string | null;
  partyType?: string | null;
  canSign?: boolean;
  canApprove?: boolean;
  permissions: string[];
}

export function useProjectAccess(projectId: string | null | undefined) {
  const { data } = useQuery<ProjectAccessInfo>({
    queryKey: ["project-access", projectId],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${projectId}/access`);
      if (!r.ok) return { isMember: false, permissions: [] };
      return r.json();
    },
    enabled: !!projectId,
    staleTime: 60_000,
  });

  const permissions = data?.permissions ?? [];
  return {
    access: data,
    permissions,
    can: (perm: string) => permissions.includes(perm),
  };
}
