// یوتیلیتی‌های فارسی — تبدیل اعداد، فرمت پول، تاریخ

const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** تبدیل ارقام لاتین به فارسی */
export function toFa(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => faDigits[+d]);
}

/** تبدیل ارقام فارسی/عربی به لاتین */
export function toEn(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(faDigits.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** فرمت عدد با جداکننده‌ی هزارگان (خروجی فارسی) */
export function faNum(n: number, decimals = 0): string {
  if (!isFinite(n)) return "۰";
  const fixed = n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return toFa(fixed);
}

/** فرمت ریال به تومان با نمایش خلاصه (میلیارد/میلیون) */
export function faMoney(rial: number): string {
  if (!rial) return "۰";
  const abs = Math.abs(rial);
  if (abs >= 1_000_000_000) {
    return toFa((rial / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })) + " میلیارد";
  }
  if (abs >= 1_000_000) {
    return toFa((rial / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })) + " میلیون";
  }
  return faNum(rial) + " ریال";
}

/** فرمت ریال کامل با جداکننده */
export function faRial(rial: number): string {
  return faNum(Math.round(rial)) + " ریال";
}

/** فرمت درصد فارسی */
export function faPct(p: number): string {
  return toFa(p.toLocaleString("en-US", { maximumFractionDigits: 1 })) + "٪";
}

/** تبدیل تاریخ میلادی به شمسی (الگوریتم ساده) */
export function toJalali(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  let gyAdj = gy - (gy <= 1600 ? 621 : 1600);
  const gy2 = gm > 2 ? gyAdj + 1 : gyAdj;
  let days =
    365 * gyAdj +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  const months = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
  ];
  return `${toFa(jy)} ${months[jm - 1]} ${toFa(jd)}`;
}

/** نمودار نوار پیشرفت رنگی */
export function progressColor(p: number): string {
  if (p >= 85) return "bg-emerald-500";
  if (p >= 50) return "bg-amber-500";
  if (p >= 25) return "bg-orange-500";
  return "bg-rose-500";
}

/** مخفف نام */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}
