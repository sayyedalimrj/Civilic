"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export function MessagesView() {
  const { selectProject } = useAppStore();

  // Mock channels for demo
  const channels = [
    { id: "1", projectId: "proj-metro7", projectName: "متروی تهران خط ۷", title: "کانال عمومی پروژه", type: "عمومی", unread: 3, lastMessage: "احمد میرزایی: ریزمتره فصل ۲ به‌روزرسانی شد", time: "۲ ساعت پیش" },
    { id: "2", projectId: "proj-metro7", projectName: "متروی تهران خط ۷", title: "صورت‌وضعیت دوره ۱", type: "صورت‌وضعیت", unread: 1, lastMessage: "سید علی میرجعفری: بررسی شد، یک مورد مغایرت", time: "۵ ساعت پیش" },
    { id: "3", projectId: "proj-bridge", projectName: "پل روگذار امام رضا", title: "دفتر فنی", type: "فنی", unread: 0, lastMessage: "مهندس رضایی: نقشه‌های اجرایی ارسال شد", time: "۱ روز پیش" },
    { id: "4", projectId: "proj-metro7", projectName: "متروی تهران خط ۷", title: "کارگاه", type: "کارگاه", unread: 0, lastMessage: "احمد میرزایی: عملیات بتن‌ریزی سقف شروع شد", time: "۲ روز پیش" },
  ];

  const TYPE_COLORS: Record<string, string> = {
    "عمومی": "bg-amber-100 text-amber-800",
    "صورت‌وضعیت": "bg-emerald-100 text-emerald-800",
    "فنی": "bg-cyan-100 text-cyan-800",
    "کارگاه": "bg-orange-100 text-orange-800",
  };

  return (
    <div className="space-y-4 p-4 md:p-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="size-6 text-amber-600" />
          پیام‌ها
        </h1>
        <p className="text-sm text-muted-foreground mt-1">کانال‌های گفتگوی پروژه‌ها</p>
      </div>

      <div className="relative">
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="جستجو در پیام‌ها..." className="h-9 pr-8 text-sm" />
      </div>

      <div className="space-y-2">
        {channels.map((ch) => (
          <Card key={ch.id} className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer" >
            <CardContent className="p-3" >
              <div className="flex items-start gap-3" onClick={() => selectProject(ch.projectId, "discussion")}>
                <div className="size-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                  <MessageSquare className="size-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{ch.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{ch.time}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">{ch.lastMessage}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[8px] h-3.5">{ch.projectName}</Badge>
                    <Badge className={`text-[8px] h-3.5 ${TYPE_COLORS[ch.type] || "bg-muted"}`}>{ch.type}</Badge>
                    {ch.unread > 0 && <Badge className="text-[8px] h-3.5 bg-rose-500 text-white">{ch.unread} جدید</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
