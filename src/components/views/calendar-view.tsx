"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon, Plus, ChevronRight, ChevronLeft, Clock,
  MapPin, Users, Flag, CheckCircle2, X, Trash2,
} from "lucide-react";
import { toFa, toJalali } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  location: string | null;
  attendees: string;
  status: string;
  color: string;
  project?: { name: string; code: string } | null;
}

const EVENT_TYPES = [
  { value: "DEADLINE", label: "موعد نهایی", color: "rose", bg: "bg-rose-500" },
  { value: "MEETING", label: "جلسه", color: "amber", bg: "bg-amber-500" },
  { value: "INSPECTION", label: "بازرسی", color: "cyan", bg: "bg-cyan-500" },
  { value: "DELIVERY", label: "تحویل", color: "emerald", bg: "bg-emerald-500" },
  { value: "PAYMENT", label: "پرداخت", color: "orange", bg: "bg-orange-500" },
  { value: "MILESTONE", label: "milestone", color: "purple", bg: "bg-purple-500" },
  { value: "OTHER", label: "سایر", color: "slate", bg: "bg-slate-500" },
];

const TYPE_META: Record<string, { label: string; bg: string; text: string }> = {
  DEADLINE: { label: "موعد", bg: "bg-rose-100 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300" },
  MEETING: { label: "جلسه", bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300" },
  INSPECTION: { label: "بازرسی", bg: "bg-cyan-100 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300" },
  DELIVERY: { label: "تحویل", bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300" },
  PAYMENT: { label: "پرداخت", bg: "bg-orange-100 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300" },
  MILESTONE: { label: "milestone", bg: "bg-purple-100 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300" },
  OTHER: { label: "سایر", bg: "bg-slate-100 dark:bg-slate-900/40", text: "text-slate-700 dark:text-slate-300" },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "برنامه‌ریزی‌شده", color: "bg-amber-100 text-amber-800" },
  COMPLETED: { label: "تکمیل‌شده", color: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "لغوشده", color: "bg-rose-100 text-rose-800" },
  POSTPONED: { label: "به‌تعویق‌افتاده", color: "bg-orange-100 text-orange-800" },
};

// تبدیل تاریخ میلادی به شمسی
function toJalaliDate(date: Date): { jy: number; jm: number; jd: number } {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  let gyAdj = gy - (gy <= 1600 ? 621 : 1600);
  const gy2 = gm > 2 ? gyAdj + 1 : gyAdj;
  let days = 365 * gyAdj + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

// تبدیل شمسی به میلادی برای محاسبه‌ی روز هفته
function getJalaliWeekday(date: Date): number {
  // 0=شنبه, 1=یکشنبه, ..., 6=جمعه
  const day = date.getDay(); // 0=Sunday
  return (day + 1) % 7;
}

function getDaysInJalaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // اسفند: 29 یا 30 (کبیسه)
  const isLeap = ((((jy - 474) % 2820) + 474 + 38) * 682) % 2816 < 682;
  return isLeap ? 30 : 29;
}

// تولید تقویم ماه شمسی
function generateJalaliMonthGrid(jy: number, jm: number): Array<{ jy: number; jm: number; jd: number; isCurrentMonth: boolean; date: Date } | null> {
  const grid: Array<{ jy: number; jm: number; jd: number; isCurrentMonth: boolean; date: Date } | null> = [];

  // روز اول ماه شمسی به میلادی
  // استفاده از الگوریتم تبدیل شمسی به میلادی
  function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
    const sal_a = jy - 979;
    const gy = sal_a < 0 ? 0 : Math.floor(sal_a / 33);
    const gy_adj = sal_a < 0 ? sal_a + 979 : sal_a - gy * 33;
    const sal_b = Math.floor((gy_adj + 1) / 4);
    const gy_c = sal_a < 0 ? 0 : Math.floor((gy_adj + 1) % 4);
    const gd_days = 365 * gy_adj + sal_b + gy_c + jd - 1;
    const gy_final = gy * 33 + 979 + Math.floor(gd_days / 1461);
    const gd_rem = gd_days % 1461;
    let g_day_no;
    if (gd_rem < 366) {
      g_day_no = gd_rem;
    } else {
      g_day_no = gd_rem - 1;
    }
    const gm_arr = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm_final = 0;
    let gd_final = 0;
    let isLeap = false;
    if (gy_final % 4 === 0 && (gy_final % 100 !== 0 || gy_final % 400 === 0)) {
      isLeap = true;
    }
    let remaining = g_day_no + 1;
    for (let i = 0; i < 12; i++) {
      const daysInMonth = i === 1 && isLeap ? 29 : gm_arr[i];
      if (remaining <= daysInMonth) {
        gm_final = i + 1;
        gd_final = remaining;
        break;
      }
      remaining -= daysInMonth;
    }
    return new Date(gy_final, gm_final - 1, gd_final);
  }

  const firstDay = jalaliToGregorian(jy, jm, 1);
  const firstWeekday = getJalaliWeekday(firstDay); // 0=شنبه

  // روزهای ماه قبل
  const prevJm = jm === 1 ? 12 : jm - 1;
  const prevJy = jm === 1 ? jy - 1 : jy;
  const prevMonthDays = getDaysInJalaliMonth(prevJy, prevJm);

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const date = jalaliToGregorian(prevJy, prevJm, day);
    grid.push({ jy: prevJy, jm: prevJm, jd: day, isCurrentMonth: false, date });
  }

  // روزهای ماه جاری
  const daysInMonth = getDaysInJalaliMonth(jy, jm);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = jalaliToGregorian(jy, jm, day);
    grid.push({ jy, jm, jd: day, isCurrentMonth: true, date });
  }

  // روزهای ماه بعد تا تکمیل grid
  const nextJm = jm === 12 ? 1 : jm + 1;
  const nextJy = jm === 12 ? jy + 1 : jy;
  let nextDay = 1;
  while (grid.length % 7 !== 0 || grid.length < 42) {
    const date = jalaliToGregorian(nextJy, nextJm, nextDay);
    grid.push({ jy: nextJy, jm: nextJm, jd: nextDay, isCurrentMonth: false, date });
    nextDay++;
    if (grid.length >= 42) break;
  }

  return grid;
}

const EMPTY_FORM = {
  title: "", description: "", type: "MEETING",
  startDate: "", endDate: "", location: "", attendees: "",
};

export function CalendarView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const today = new Date();
  const todayJalali = toJalaliDate(today);
  const [currentJy, setCurrentJy] = useState(todayJalali.jy);
  const [currentJm, setCurrentJm] = useState(todayJalali.jm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const { data, isLoading } = useQuery<{ events: CalendarEvent[] }>({
    queryKey: ["calendar-events", currentJy, currentJm],
    queryFn: async () => {
      const r = await fetch("/api/calendar");
      return r.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const r = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          startDate: payload.startDate || selectedDate,
          attendees: payload.attendees ? payload.attendees.split("،").map((s) => s.trim()) : [],
        }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "رویداد ایجاد شد" });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      setDialogOpen(false);
      setForm({ ...EMPTY_FORM });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      setSelectedEvent(null);
      toast({ title: "رویداد حذف شد" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (event: CalendarEvent) => {
      const r = await fetch(`/api/calendar/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      setSelectedEvent(null);
      toast({ title: "رویداد تکمیل شد" });
    },
  });

  const events = data?.events || [];
  const monthGrid = useMemo(() => generateJalaliMonthGrid(currentJy, currentJm), [currentJy, currentJm]);

  // گروه‌بندی رویدادها بر اساس تاریخ
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const dateKey = e.startDate.split("T")[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(e);
    }
    return map;
  }, [events]);

  const prevMonth = () => {
    if (currentJm === 1) { setCurrentJm(12); setCurrentJy(currentJy - 1); }
    else setCurrentJm(currentJm - 1);
  };
  const nextMonth = () => {
    if (currentJm === 12) { setCurrentJm(1); setCurrentJy(currentJy + 1); }
    else setCurrentJm(currentJm + 1);
  };
  const goToday = () => {
    setCurrentJy(todayJalali.jy);
    setCurrentJm(todayJalali.jm);
  };

  const openAdd = (dateStr?: string) => {
    setSelectedDate(dateStr || "");
    setForm({ ...EMPTY_FORM, startDate: dateStr || "" });
    setDialogOpen(true);
  };

  const isToday = (jd: number, jm: number, jy: number) =>
    jd === todayJalali.jd && jm === todayJalali.jm && jy === todayJalali.jy;

  // رویدادهای آینده (next 7 days)
  const upcomingEvents = events
    .filter((e) => new Date(e.startDate) >= new Date(today.setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="size-6 text-amber-600" />
            تقویم پروژه
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            رویدادها، موعد‌ها، جلسات و milestone‌های پروژه‌ها
          </p>
        </div>
        <Button size="sm" className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-700" onClick={() => openAdd()}>
          <Plus className="size-4" />
          رویداد جدید
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-sm">
            {/* Month navigation */}
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="size-8" onClick={prevMonth}>
                  <ChevronRight className="size-4" />
                </Button>
                <h2 className="text-sm font-bold min-w-[120px] text-center">
                  {JALALI_MONTHS[currentJm - 1]} {toFa(currentJy)}
                </h2>
                <Button variant="ghost" size="icon" className="size-8" onClick={nextMonth}>
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={goToday}>
                  امروز
                </Button>
                {/* Legend */}
                <div className="hidden md:flex items-center gap-1.5">
                  {EVENT_TYPES.slice(0, 4).map((t) => (
                    <div key={t.value} className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                      <span className={cn("size-2 rounded-sm", t.bg)} />
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b">
              {WEEKDAYS.map((day) => (
                <div key={day} className="p-2 text-center text-[10px] font-semibold text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {monthGrid.map((cell, idx) => {
                if (!cell) return <div key={idx} className="min-h-[80px] border-b border-l p-1" />;
                const dateKey = cell.date.toISOString().split("T")[0];
                const dayEvents = eventsByDate.get(dateKey) || [];
                const today = isToday(cell.jd, cell.jm, cell.jy);
                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[80px] border-b border-l p-1 cursor-pointer hover:bg-muted/30 transition-colors relative",
                      !cell.isCurrentMonth && "bg-muted/20 text-muted-foreground",
                      today && "bg-amber-50 dark:bg-amber-950/20 ring-1 ring-amber-400 ring-inset"
                    )}
                    onClick={() => openAdd(dateKey)}
                  >
                    <div className={cn(
                      "text-[10px] font-medium mb-0.5 flex items-center justify-center size-5 rounded-full",
                      today && "bg-amber-500 text-white",
                      !today && cell.isCurrentMonth && "text-foreground"
                    )}>
                      {toFa(cell.jd)}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e) => {
                        const meta = TYPE_META[e.type] || TYPE_META.OTHER;
                        return (
                          <div
                            key={e.id}
                            className={cn("text-[8px] px-1 py-0.5 rounded truncate", meta.bg, meta.text)}
                            onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
                            title={e.title}
                          >
                            {e.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-[8px] text-muted-foreground text-center">
                          +{toFa(dayEvents.length - 3)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="size-4 text-amber-600" />
                رویدادهای آینده
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {isLoading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)
              ) : !upcomingEvents.length ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <CalendarIcon className="size-8 mx-auto mb-2 text-amber-300" />
                  رویدادی نیست
                </div>
              ) : (
                upcomingEvents.map((e) => {
                  const meta = TYPE_META[e.type] || TYPE_META.OTHER;
                  const status = STATUS_META[e.status] || STATUS_META.SCHEDULED;
                  return (
                    <div
                      key={e.id}
                      className="p-2 rounded-md border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedEvent(e)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn("size-2 rounded-full mt-1.5 shrink-0", meta.bg.replace("bg-", "bg-").replace("100", "500").replace("950/40", "500"))} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{e.title}</div>
                          <div className="text-[9px] text-muted-foreground">
                            {toJalali(e.startDate)}
                          </div>
                          <Badge className={cn("text-[8px] h-3.5 mt-0.5", meta.bg, meta.text)}>
                            {meta.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>رویداد جدید</DialogTitle>
            <DialogDescription>
              {selectedDate ? `تاریخ: ${toJalali(selectedDate)}` : "ایجاد رویداد تقویمی"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">عنوان <span className="text-rose-500">*</span></Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 text-xs" placeholder="مثلاً جلسه بازرسی فصل ۲" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">نوع رویداد</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">تاریخ شروع</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-9 text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">توضیحات</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[50px] text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">محل</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">شرکت‌کنندگان (با ، جدا کنید)</Label>
                <Input value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} className="h-9 text-xs" placeholder="میرجعفری، میرزایی" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" disabled={!form.title || createMutation.isPending} onClick={() => createMutation.mutate(form)}>
              {createMutation.isPending ? "در حال ایجاد..." : "ایجاد رویداد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedEvent.title}
                  <Badge className={cn("text-[9px]", (TYPE_META[selectedEvent.type] || TYPE_META.OTHER).bg, (TYPE_META[selectedEvent.type] || TYPE_META.OTHER).text)}>
                    {(TYPE_META[selectedEvent.type] || TYPE_META.OTHER).label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedEvent.description || "بدون توضیحات"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span>{toJalali(selectedEvent.startDate)}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.attendees && selectedEvent.attendees !== "[]" && (
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5 text-muted-foreground" />
                    <span>{(JSON.parse(selectedEvent.attendees) as string[]).join("، ") || "—"}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Flag className="size-3.5 text-muted-foreground" />
                  <Badge className={cn("text-[9px]", (STATUS_META[selectedEvent.status] || STATUS_META.SCHEDULED).color)}>
                    {(STATUS_META[selectedEvent.status] || STATUS_META.SCHEDULED).label}
                  </Badge>
                </div>
                {selectedEvent.project && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">پروژه:</span>
                    <span className="font-medium">{selectedEvent.project.name}</span>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" className="text-rose-600" onClick={() => deleteMutation.mutate(selectedEvent.id)}>
                  <Trash2 className="size-3.5" /> حذف
                </Button>
                {selectedEvent.status !== "COMPLETED" && (
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => completeMutation.mutate(selectedEvent)}>
                    <CheckCircle2 className="size-3.5" /> تکمیل شد
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
