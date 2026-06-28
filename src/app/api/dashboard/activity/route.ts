import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dashboard/activity — نقشه‌ی حرارتی فعالیت کاربران
// خروجی: ماتریس فعالیت بر اساس روز هفته × ساعت روز
export async function GET() {
  // جمع‌آوری همه‌ی رویدادهای زمان‌دار از جداول مختلف
  const [comments, alerts, changeOrders, chatMessages, documents, payments] = await Promise.all([
    db.comment.findMany({ select: { createdAt: true, userId: true, userName: true } }),
    db.alert.findMany({ select: { createdAt: true } }),
    db.changeOrder.findMany({ select: { submittedAt: true, requestedBy: true, requestedByName: true } }),
    db.chatMessage.findMany({ select: { createdAt: true, senderId: true } }),
    db.documentFile.findMany({ select: { createdAt: true, uploadedByName: true } }),
    db.payment.findMany({ select: { createdAt: true, submittedAt: true, updatedAt: true } }),
  ]);

  // ماتریس ۷×۲۴ (روز هفته × ساعت)
  // 0=شنبه, 1=یکشنبه, ..., 6=جمعه
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  // تجمیع همه‌ی timestamp‌ها
  const allTimestamps: Date[] = [
    ...comments.map((c) => c.createdAt),
    ...alerts.map((a) => a.createdAt),
    ...changeOrders.map((c) => c.submittedAt),
    ...chatMessages.map((m) => m.createdAt),
    ...documents.map((d) => d.createdAt),
    ...payments.flatMap((p) => [p.createdAt, p.submittedAt, p.updatedAt].filter(Boolean) as Date[]),
  ];

  for (const ts of allTimestamps) {
    const day = (ts.getDay() + 1) % 7; // 0=شنبه
    const hour = ts.getHours();
    heatmap[day][hour]++;
  }

  // آمار کاربران
  const userActivity = new Map<string, { name: string; count: number; lastActive: Date }>();
  for (const c of comments) {
    if (!userActivity.has(c.userId)) {
      userActivity.set(c.userId, { name: c.userName, count: 0, lastActive: c.createdAt });
    }
    const u = userActivity.get(c.userId)!;
    u.count++;
    if (c.createdAt > u.lastActive) u.lastActive = c.createdAt;
  }
  for (const c of changeOrders) {
    if (!userActivity.has(c.requestedBy)) {
      userActivity.set(c.requestedBy, { name: c.requestedByName, count: 0, lastActive: c.submittedAt });
    }
    const u = userActivity.get(c.requestedBy)!;
    u.count++;
    if (c.submittedAt > u.lastActive) u.lastActive = c.submittedAt;
  }
  for (const m of chatMessages) {
    if (!userActivity.has(m.senderId)) {
      userActivity.set(m.senderId, { name: "کاربر", count: 0, lastActive: m.createdAt });
    }
    const u = userActivity.get(m.senderId)!;
    u.count++;
    if (m.createdAt > u.lastActive) u.lastActive = m.createdAt;
  }
  for (const d of documents) {
    if (d.uploadedByName) {
      if (!userActivity.has(d.uploadedByName)) {
        userActivity.set(d.uploadedByName, { name: d.uploadedByName, count: 0, lastActive: d.createdAt });
      }
      const u = userActivity.get(d.uploadedByName)!;
      u.count++;
      if (d.createdAt > u.lastActive) u.lastActive = d.createdAt;
    }
  }

  const users = Array.from(userActivity.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count);

  // ساعات اوج فعالیت
  const hourlyActivity = Array(24).fill(0);
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      hourlyActivity[hour] += heatmap[day][hour];
    }
  }
  const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));

  // روزهای اوج فعالیت
  const dailyActivity = heatmap.map((day) => day.reduce((s, h) => s + h, 0));
  const peakDay = dailyActivity.indexOf(Math.max(...dailyActivity));

  const weekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

  return NextResponse.json({
    heatmap,
    users,
    summary: {
      totalActivities: allTimestamps.length,
      peakHour,
      peakDay,
      peakDayName: weekdays[peakDay],
      activeUsers: users.length,
      avgPerUser: users.length > 0 ? allTimestamps.length / users.length : 0,
    },
    weekdays,
    hourlyActivity,
    dailyActivity: dailyActivity.map((count, idx) => ({ day: weekdays[idx], count })),
  });
}
