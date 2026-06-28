"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Send,
  X,
  Plus,
  ArrowRight,
  Search,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toFa, toJalali } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";

interface ChatParticipant {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface ChatThread {
  id: string;
  participants: ChatParticipant[];
  lastMessage: {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    readBy: string[];
    createdAt: string;
  } | null;
  lastMessageAt: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  sender?: { id: string; name: string; avatarUrl?: string | null; role?: string };
  content: string;
  readBy: string[];
  createdAt: string;
}

const CURRENT_USER_ID = "user-admin"; // سید علی میرجعفری

function relativeTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "هم‌اکنون";
  if (diff < 3600) return `${toFa(Math.floor(diff / 60))} دقیقه پیش`;
  if (diff < 86400) return `${toFa(Math.floor(diff / 3600))} ساعت پیش`;
  if (diff < 604800) return `${toFa(Math.floor(diff / 86400))} روز پیش`;
  return toJalali(d);
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadParticipant, setNewThreadParticipant] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  // لیست مکالمات
  const { data: threadsData, isLoading: threadsLoading } = useQuery<{
    threads: ChatThread[];
  }>({
    queryKey: ["chat-threads"],
    queryFn: async () => {
      const r = await fetch("/api/chat/threads");
      return r.json();
    },
    enabled: open,
    refetchInterval: 8000,
  });

  // پیام‌های مکالمه فعال
  const { data: messagesData } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ["chat-messages", activeThreadId],
    queryFn: async () => {
      const r = await fetch(`/api/chat/threads/${activeThreadId}/messages`);
      return r.json();
    },
    enabled: open && !!activeThreadId,
    refetchInterval: 4000,
  });

  // ارسال پیام
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const r = await fetch(`/api/chat/threads/${activeThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: CURRENT_USER_ID, content }),
      });
      if (!r.ok) throw new Error("خطا در ارسال");
      return r.json();
    },
    onSuccess: () => {
      setMessageText("");
      qc.invalidateQueries({ queryKey: ["chat-messages", activeThreadId] });
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    },
    onError: () => toast({ title: "خطا در ارسال پیام", variant: "destructive" }),
  });

  // ایجاد مکالمه جدید
  const createThread = useMutation({
    mutationFn: async (participantId: string) => {
      const r = await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: [CURRENT_USER_ID, participantId] }),
      });
      if (!r.ok) throw new Error("خطا در ایجاد مکالمه");
      return r.json();
    },
    onSuccess: (data) => {
      setShowNewThread(false);
      setNewThreadParticipant("");
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
      setActiveThreadId(data.thread.id);
      toast({ title: "مکالمه جدید ایجاد شد" });
    },
    onError: () =>
      toast({ title: "خطا در ایجاد مکالمه", variant: "destructive" }),
  });

  // اسکرول به آخرین پیام
  useEffect(() => {
    if (scrollRef.current && messagesData?.messages) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesData?.messages]);

  const activeThread = threadsData?.threads.find(
    (t) => t.id === activeThreadId
  );
  const messages = messagesData?.messages || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-2xl p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="size-5 text-amber-600" />
              پیام‌رسان سازمانی
            </SheetTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => setShowNewThread((v) => !v)}
            >
              <Plus className="size-3.5" />
              مکالمه جدید
            </Button>
          </div>
        </SheetHeader>

        {showNewThread && (
          <div className="border-b bg-amber-50/50 dark:bg-amber-950/20 p-3">
            <UserPicker
              value={newThreadParticipant}
              onChange={setNewThreadParticipant}
              excludeId={CURRENT_USER_ID}
            />
            <Button
              size="sm"
              className="mt-2 w-full h-9"
              disabled={!newThreadParticipant}
              onClick={() => createThread.mutate(newThreadParticipant)}
            >
              شروع مکالمه
            </Button>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
          {/* لیست مکالمات */}
          <div
            className={cn(
              "w-64 border-l flex flex-col",
              activeThreadId && "hidden sm:flex"
            )}
          >
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="جستجوی مکالمه..."
                  className="h-8 pr-7 text-xs"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {threadsLoading ? (
                <div className="p-3 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-md bg-muted/40 animate-pulse"
                    />
                  ))}
                </div>
              ) : !threadsData?.threads?.length ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  <MessageCircle className="size-8 mx-auto mb-2 text-amber-300" />
                  هنوز مکالمه‌ای ندارید
                  <br />
                  روی «مکالمه جدید» بزنید
                </div>
              ) : (
                <div className="p-1 space-y-1">
                  {threadsData.threads.map((t) => {
                    const other = t.participants.find(
                      (p) => p.id !== CURRENT_USER_ID
                    );
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveThreadId(t.id)}
                        className={cn(
                          "w-full text-right p-2 rounded-md transition-colors flex items-center gap-2",
                          activeThreadId === t.id
                            ? "bg-amber-100 dark:bg-amber-900/40"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <Avatar className="size-9 ring-1 ring-amber-200 dark:ring-amber-800">
                          <AvatarFallback className="bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 dark:from-amber-900 dark:to-orange-900 dark:text-amber-200 text-xs">
                            {other ? initials(other.name) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">
                            {other?.name || "نامشخص"}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {t.lastMessage?.content || "بدون پیام"}
                          </div>
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          {t.lastMessageAt ? relativeTime(t.lastMessageAt) : ""}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* محتوای مکالمه */}
          <div
            className={cn(
              "flex-1 flex flex-col min-w-0",
              !activeThreadId && "hidden sm:flex"
            )}
          >
            {!activeThreadId ? (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="size-10 mx-auto mb-3 text-amber-300" />
                  یک مکالمه را انتخاب کنید
                </div>
              </div>
            ) : (
              <>
                <div className="border-b p-3 flex items-center gap-2 bg-card">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 sm:hidden"
                    onClick={() => setActiveThreadId(null)}
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                  {(() => {
                    const other = activeThread?.participants.find(
                      (p) => p.id !== CURRENT_USER_ID
                    );
                    return (
                      <>
                        <Avatar className="size-8 ring-1 ring-amber-200 dark:ring-amber-800">
                          <AvatarFallback className="bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 dark:from-amber-900 dark:to-orange-900 dark:text-amber-200 text-[10px]">
                            {other ? initials(other.name) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">
                            {other?.name}
                          </div>
                          <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            آنلاین
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-transparent to-amber-50/30 dark:to-amber-950/10"
                >
                  {!messages.length ? (
                    <div className="text-center text-xs text-muted-foreground py-10">
                      شروع مکالمه — اولین پیام را ارسال کنید
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === CURRENT_USER_ID;
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "flex gap-2",
                            isMe ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                          <Avatar className="size-7 shrink-0 mt-0.5">
                            <AvatarFallback
                              className={cn(
                                "text-[10px]",
                                isMe
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              )}
                            >
                              {m.sender ? initials(m.sender.name) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              "max-w-[75%] flex flex-col",
                              isMe ? "items-end" : "items-start"
                            )}
                          >
                            <div
                              className={cn(
                                "px-3 py-2 rounded-2xl text-xs leading-relaxed",
                                isMe
                                  ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-tl-md"
                                  : "bg-card border rounded-tr-md"
                              )}
                            >
                              {m.content}
                            </div>
                            <div className="text-[9px] text-muted-foreground mt-1 px-1">
                              {relativeTime(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t p-2 bg-card">
                  <div className="flex gap-2 items-end">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (messageText.trim())
                            sendMessage.mutate(messageText.trim());
                        }
                      }}
                      placeholder="پیام بنویسید... (Enter برای ارسال)"
                      className="flex-1 h-9 text-xs"
                    />
                    <Button
                      size="sm"
                      className="h-9 px-3 bg-amber-600 hover:bg-amber-700"
                      disabled={!messageText.trim() || sendMessage.isPending}
                      onClick={() =>
                        messageText.trim() && sendMessage.mutate(messageText.trim())
                      }
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// انتخاب‌گر کاربر برای ایجاد مکالمه جدید
function UserPicker({
  value,
  onChange,
  excludeId,
}: {
  value: string;
  onChange: (v: string) => void;
  excludeId?: string;
}) {
  const { data } = useQuery<{
    users: { id: string; name: string; role: string; email: string }[];
  }>({
    queryKey: ["users-list"],
    queryFn: async () => {
      const r = await fetch("/api/users");
      return r.json();
    },
  });

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 text-xs rounded-md border bg-background px-2"
    >
      <option value="">انتخاب کاربر...</option>
      {data?.users
        ?.filter((u) => u.id !== excludeId)
        .map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.role})
          </option>
        ))}
    </select>
  );
}
