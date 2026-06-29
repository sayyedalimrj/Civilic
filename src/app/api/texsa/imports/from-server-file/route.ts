import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth/session";
import { canUseTexsa } from "@/lib/auth/texsa-access";
import { BUCKET_DIRS } from "@/lib/storage/upload-config";
import { importLocalSvzt } from "@/lib/texsa/import/import-local";
import { writeAudit, clientIp } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 300;

const TEXSA_DIR = path.resolve(BUCKET_DIRS.texsa);

// GET — فهرست فایل‌های .svzt موجود در TEXSA_UPLOAD_DIR (هرگز خارج از این دایرکتوری)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  if (!(await canUseTexsa(user.id, "texsa.import"))) {
    return NextResponse.json({ error: "مجوز ایمپورت تکسا را ندارید" }, { status: 403 });
  }

  let files: { name: string; sizeBytes: number }[] = [];
  try {
    const names = await readdir(TEXSA_DIR);
    files = (
      await Promise.all(
        names
          .filter((n) => n.toLowerCase().endsWith(".svzt"))
          .map(async (n) => {
            try {
              const s = await stat(path.join(TEXSA_DIR, n));
              return s.isFile() ? { name: n, sizeBytes: s.size } : null;
            } catch {
              return null;
            }
          })
      )
    ).filter((x): x is { name: string; sizeBytes: number } => x !== null);
  } catch {
    files = []; // دایرکتوری وجود ندارد → فهرست خالی
  }
  return NextResponse.json({ dir: TEXSA_DIR, files });
}

const schema = z.object({ fileName: z.string().min(1, "نام فایل الزامی است") });

// POST — ایمپورت یک فایل سرور از داخل TEXSA_UPLOAD_DIR (با مهار path traversal)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  if (!(await canUseTexsa(user.id, "texsa.import"))) {
    return NextResponse.json({ error: "مجوز ایمپورت تکسا را ندارید" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" }, { status: 400 });
  }

  // فقط basename پذیرفته می‌شود؛ مسیر باید داخل TEXSA_DIR بماند
  const safeName = path.basename(parsed.data.fileName);
  if (!safeName.toLowerCase().endsWith(".svzt")) {
    return NextResponse.json({ error: "فقط فایل .svzt مجاز است" }, { status: 400 });
  }
  const abs = path.resolve(TEXSA_DIR, safeName);
  if (abs !== path.join(TEXSA_DIR, safeName) || !abs.startsWith(TEXSA_DIR + path.sep)) {
    return NextResponse.json({ error: "مسیر فایل نامعتبر است" }, { status: 400 });
  }
  try {
    const s = await stat(abs);
    if (!s.isFile()) throw new Error("not a file");
  } catch {
    return NextResponse.json({ error: "فایل روی سرور یافت نشد" }, { status: 404 });
  }

  try {
    const result = await importLocalSvzt(abs);
    await writeAudit({
      tenantId: user.tenantId ?? "", userId: user.id, userName: user.name,
      action: "TEXSA_IMPORT", entityType: "TEXSA_IMPORT", entityId: result.importId,
      after: { fileName: safeName, totalRows: result.totalRows, totalTables: result.totalTables },
      ipAddr: clientIp(req.headers),
    });
    return NextResponse.json({ import: result }, { status: 201 });
  } catch (err) {
    console.error("[texsa from-server-file] error:", err);
    return NextResponse.json({ error: "خطا در ایمپورت فایل تکسا" }, { status: 500 });
  }
}
