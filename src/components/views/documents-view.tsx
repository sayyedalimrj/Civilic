"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText, Search, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";

export function DocumentsView() {
  const { selectProject } = useAppStore();

  const documents = [
    { id: "1", projectId: "proj-metro7", projectName: "متروی تهران خط ۷", title: "قرارداد اصلی پیمان", type: "قرارداد", date: "۱۴۰۳/۰۱/۰۱", status: "تأییدشده" },
    { id: "2", projectId: "proj-metro7", projectName: "متروی تهران خط ۷", title: "صورتجلسه شماره ۳ — عملیات خاکبرداری", type: "صورتجلسه", date: "۱۴۰۴/۰۴/۱۵", status: "ارسال‌شده" },
    { id: "3", projectId: "proj-bridge", projectName: "پل روگذار امام رضا", title: "نامه شماره ۱۲ — درخواست توضیح", type: "نامه", date: "۱۴۰۴/۰۴/۱۰", status: "در انتظار پاسخ" },
    { id: "4", projectId: "proj-metro7", projectName: "متروی تهران خط ۷", title: "دستورکار شماره ۵ — تغییر مصالح بتن", type: "دستورکار", date: "۱۴۰۴/۰۳/۲۰", status: "اجرا‌شده" },
    { id: "5", projectId: "proj-bridge", projectName: "پل روگذار امام رضا", title: "نقشه‌های اجرایی فصل ۲", type: "نقشه", date: "۱۴۰۴/۰۳/۰۵", status: "تأییدشده" },
  ];

  const TYPE_COLORS: Record<string, string> = {
    "قرارداد": "bg-purple-100 text-purple-800",
    "صورتجلسه": "bg-amber-100 text-amber-800",
    "نامه": "bg-cyan-100 text-cyan-800",
    "دستورکار": "bg-orange-100 text-orange-800",
    "نقشه": "bg-emerald-100 text-emerald-800",
  };
  const STATUS_COLORS: Record<string, string> = {
    "تأییدشده": "bg-emerald-100 text-emerald-800",
    "ارسال‌شده": "bg-amber-100 text-amber-800",
    "در انتظار پاسخ": "bg-rose-100 text-rose-800",
    "اجرا‌شده": "bg-slate-100 text-slate-800",
  };

  return (
    <div className="space-y-4 p-4 md:p-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FolderOpen className="size-6 text-amber-600" />
          اسناد و مکاتبات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">قراردادها، صورتجلسات، نامه‌ها و دستورکارها</p>
      </div>

      <div className="relative">
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="جستجو در اسناد..." className="h-9 pr-8 text-sm" />
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <Card key={doc.id} className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-3" onClick={() => selectProject(doc.projectId, "documents")}>
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                  <FileText className="size-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{doc.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{doc.date}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[8px] h-3.5">{doc.projectName}</Badge>
                    <Badge className={`text-[8px] h-3.5 ${TYPE_COLORS[doc.type] || "bg-muted"}`}>{doc.type}</Badge>
                    <Badge className={`text-[8px] h-3.5 ${STATUS_COLORS[doc.status] || "bg-muted"}`}>{doc.status}</Badge>
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
