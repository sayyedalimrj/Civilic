/**
 * upload-config.ts — پیکربندی ذخیره‌سازی فایل (دیسک سرور)
 *
 * فایل‌ها فقط زیر دایرکتوری‌های پیکربندی‌شده ذخیره می‌شوند. هیچ مسیر دلخواهی
 * از سمت کاربر پذیرفته نمی‌شود. مقادیر از env خوانده می‌شوند و در صورت نبود،
 * به مسیر امن داخل workspace fallback می‌کنند (برای dev/sandbox).
 */
import path from "node:path";

export type UploadBucket = "documents" | "texsa";

function envDir(key: string, fallback: string): string {
  const v = process.env[key];
  return v && v.trim().length > 0 ? v.trim() : fallback;
}

// ریشه‌ی پیش‌فرض (وقتی env تنظیم نشده): داخل workspace، خارج از public
const DEFAULT_ROOT = path.join(process.cwd(), ".uploads");

/** ریشه‌ی کلی آپلودها */
export const UPLOAD_ROOT = envDir("CIVILIC_UPLOAD_DIR", DEFAULT_ROOT);

/** دایرکتوری هر bucket */
export const BUCKET_DIRS: Record<UploadBucket, string> = {
  documents: envDir("DOCUMENT_UPLOAD_DIR", path.join(UPLOAD_ROOT, "documents")),
  texsa: envDir("TEXSA_UPLOAD_DIR", path.join(UPLOAD_ROOT, "texsa")),
};

/** حداکثر حجم مجاز (بایت) */
export const MAX_UPLOAD_BYTES =
  (Number(process.env.MAX_UPLOAD_MB) || 500) * 1024 * 1024;

/** پسوندهای مجاز برای اسناد عمومی */
export const ALLOWED_DOCUMENT_EXT = new Set([
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tif", ".tiff",
  ".txt", ".csv", ".zip", ".rar", ".7z", ".dwg", ".dxf",
]);

/** پسوندهای مجاز برای فایل تکسا */
export const ALLOWED_TEXSA_EXT = new Set([".svzt"]);

/** پسوندهای خطرناک که هرگز اجازه‌ی آپلود ندارند */
export const FORBIDDEN_EXT = new Set([
  ".exe", ".sh", ".bat", ".cmd", ".com", ".js", ".mjs", ".cjs",
  ".php", ".py", ".rb", ".pl", ".jar", ".msi", ".app", ".dll", ".so",
  ".html", ".htm", ".svg", // svg/html به‌خاطر XSS مجاز نیست
]);

export function allowedExtFor(bucket: UploadBucket): Set<string> {
  return bucket === "texsa" ? ALLOWED_TEXSA_EXT : ALLOWED_DOCUMENT_EXT;
}
