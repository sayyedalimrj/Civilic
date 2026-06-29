/**
 * upload-security.ts — امنیت آپلود فایل
 *
 * مسئولیت‌ها:
 *  - تولید نام امن ذخیره‌شده (uuid.ext) و نگه‌داری جداگانه‌ی نام اصلی.
 *  - جلوگیری از path traversal: فایل فقط زیر دایرکتوری bucket نوشته/خوانده می‌شود.
 *  - اعتبارسنجی پسوند/نوع و حجم.
 *  - محاسبه‌ی sha256 و نوشتن استریمی روی دیسک (بدون لود کل فایل در حافظه برای دانلود).
 *  - هیچ فایل آپلودشده‌ای اجرا نمی‌شود؛ فقط ذخیره/سرو می‌شود.
 */
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, writeFile, stat } from "node:fs/promises";
import {
  BUCKET_DIRS,
  MAX_UPLOAD_BYTES,
  FORBIDDEN_EXT,
  allowedExtFor,
  type UploadBucket,
} from "@/lib/storage/upload-config";

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "UploadError";
    this.status = status;
  }
}

/** پسوند امن و کوچک‌شده‌ی فایل (با نقطه)، مثلاً ".pdf" */
export function safeExt(originalName: string): string {
  const ext = path.extname(originalName || "").toLowerCase();
  // فقط حروف/ارقام مجاز در پسوند
  if (!/^\.[a-z0-9]{1,8}$/.test(ext)) return "";
  return ext;
}

/** نام اصلی را برای نمایش امن می‌کند (حذف مسیر و کاراکترهای خطرناک) */
export function sanitizeOriginalName(name: string): string {
  const base = path.basename(name || "file");
  return base.replace(/[\u0000-\u001f<>:"/\\|?*]+/g, "_").slice(0, 200) || "file";
}

/** اعتبارسنجی پسوند بر اساس bucket؛ خطا در صورت نامجاز/خطرناک */
export function validateExtension(originalName: string, bucket: UploadBucket): string {
  const ext = safeExt(originalName);
  if (!ext) throw new UploadError("پسوند فایل نامعتبر است");
  if (FORBIDDEN_EXT.has(ext)) {
    throw new UploadError("این نوع فایل به دلایل امنیتی مجاز نیست");
  }
  if (!allowedExtFor(bucket).has(ext)) {
    throw new UploadError(`پسوند ${ext} برای این بخش مجاز نیست`);
  }
  return ext;
}

/** اعتبارسنجی حجم فایل */
export function validateSize(sizeBytes: number): void {
  if (sizeBytes <= 0) throw new UploadError("فایل خالی است");
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    const mb = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
    throw new UploadError(`حجم فایل بیش از حد مجاز است (حداکثر ${mb} مگابایت)`);
  }
}

/**
 * مسیر مطلق امن داخل bucket را می‌سازد و تضمین می‌کند خارج از ریشه نباشد.
 * relativePath فقط نام امن فایل است؛ هرگز ورودی کاربر.
 */
export function resolveSecurePath(bucket: UploadBucket, relativePath: string): string {
  const root = path.resolve(BUCKET_DIRS[bucket]);
  // فقط basename پذیرفته می‌شود تا traversal غیرممکن شود
  const safeRel = path.basename(relativePath);
  const full = path.resolve(root, safeRel);
  if (full !== path.join(root, safeRel) || !full.startsWith(root + path.sep)) {
    throw new UploadError("مسیر فایل نامعتبر است", 400);
  }
  return full;
}

export interface StoredFile {
  storedName: string;
  storagePath: string; // نسبی داخل bucket (فقط نام امن)
  absolutePath: string;
  sizeBytes: number;
  sha256: string;
  ext: string;
}

/**
 * فایل را روی دیسک ذخیره می‌کند و sha256 و حجم را برمی‌گرداند.
 * نام ذخیره‌شده uuid + پسوند امن است؛ هیچ ورودی کاربر در مسیر استفاده نمی‌شود.
 */
export async function storeUpload(
  bucket: UploadBucket,
  originalName: string,
  data: Buffer
): Promise<StoredFile> {
  const ext = validateExtension(originalName, bucket);
  validateSize(data.byteLength);

  const root = path.resolve(BUCKET_DIRS[bucket]);
  await mkdir(root, { recursive: true });

  const storedName = `${randomUUID()}${ext}`;
  const absolutePath = resolveSecurePath(bucket, storedName);

  const sha256 = createHash("sha256").update(data).digest("hex");

  // نوشتن روی دیسک (هرگز اجرایی؛ بدون مجوز اجرا)
  await writeFile(absolutePath, data, { mode: 0o640 });

  return {
    storedName,
    storagePath: storedName,
    absolutePath,
    sizeBytes: data.byteLength,
    sha256,
    ext,
  };
}

/** استریم خواندن فایل برای دانلود (بدون لود کل فایل در حافظه) */
export function openDownloadStream(bucket: UploadBucket, storagePath: string) {
  const absolutePath = resolveSecurePath(bucket, storagePath);
  return { absolutePath, stream: createReadStream(absolutePath) };
}

/** بررسی وجود فیزیکی فایل */
export async function fileExists(bucket: UploadBucket, storagePath: string): Promise<boolean> {
  try {
    const absolutePath = resolveSecurePath(bucket, storagePath);
    const s = await stat(absolutePath);
    return s.isFile();
  } catch {
    return false;
  }
}
