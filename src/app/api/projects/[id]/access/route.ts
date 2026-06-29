import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectAccess } from "@/lib/auth/permissions";

export const runtime = "nodejs";

// GET /api/projects/[id]/access — دسترسی کاربر فعلی در این پروژه (برای permission-aware UI)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });

  const access = await getProjectAccess(id, user.id);
  if (!access) {
    return NextResponse.json({ isMember: false, permissions: [], role: null, partyType: null });
  }
  return NextResponse.json({
    isMember: true,
    userId: user.id,
    role: access.member.role,
    partyType: access.member.partyType,
    canSign: access.member.canSign,
    canApprove: access.member.canApprove,
    permissions: access.permissions,
  });
}
