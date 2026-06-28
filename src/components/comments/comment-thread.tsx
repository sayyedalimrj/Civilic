"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Send,
  X,
  Check,
  Reply,
  Trash2,
  AtSign,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toFa, toJalali } from "@/lib/fa";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  parentCommentId: string | null;
  content: string;
  mentions: string[];
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommentThreadProps {
  projectId: string;
  entityType: string;
  entityId: string;
  entityLabel?: string;
  /** Trigger button variant — defaults to "ghost" */
  variant?: "ghost" | "outline";
  /** Optional className for the trigger button */
  className?: string;
}

const CURRENT_USER_ID = "user-admin";
const CURRENT_USER_NAME = "سید علی میرجعفری";

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

export function CommentThread({
  projectId,
  entityType,
  entityId,
  entityLabel,
  variant = "ghost",
  className,
}: CommentThreadProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const queryKey = [
    "comments",
    projectId,
    entityType,
    entityId,
  ];

  const { data, isLoading } = useQuery<{ comments: Comment[] }>({
    queryKey,
    queryFn: async () => {
      const r = await fetch(
        `/api/comments?projectId=${projectId}&entityType=${entityType}&entityId=${entityId}`
      );
      return r.json();
    },
    enabled: open,
  });

  // لیست کاربران برای mentions
  const { data: usersData } = useQuery<{
    users: { id: string; name: string; role: string }[];
  }>({
    queryKey: ["users-list"],
    queryFn: async () => {
      const r = await fetch("/api/users");
      return r.json();
    },
    enabled: open,
  });

  const createComment = useMutation({
    mutationFn: async (payload: {
      content: string;
      mentions: string[];
      parentCommentId?: string | null;
    }) => {
      const r = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          entityType,
          entityId,
          entityLabel,
          userId: CURRENT_USER_ID,
          userName: CURRENT_USER_NAME,
          content: payload.content,
          mentions: payload.mentions,
          parentCommentId: payload.parentCommentId || null,
        }),
      });
      if (!r.ok) throw new Error("خطا");
      return r.json();
    },
    onSuccess: () => {
      setText("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey });
      toast({ title: "کامنت ثبت شد" });
    },
  });

  const toggleResolve = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/comments/${id}/resolve`, {
        method: "PATCH",
      });
      if (!r.ok) throw new Error("خطا");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("خطا");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast({ title: "کامنت حذف شد" });
    },
  });

  // استخراج mentions از متن
  const extractMentions = (content: string): string[] => {
    const matches = content.match(/@([\u0600-\u06FF\s]+)/g) || [];
    return matches
      .map((m) => m.slice(1).trim())
      .map((name) => usersData?.users.find((u) => u.name.includes(name))?.id)
      .filter(Boolean) as string[];
  };

  const comments = data?.comments || [];
  const rootComments = comments.filter((c) => !c.parentCommentId);
  const repliesOf = (id: string) =>
    comments.filter((c) => c.parentCommentId === id);

  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  // مدیریت @mention
  const handleTextChange = (v: string) => {
    setText(v);
    const lastAt = v.lastIndexOf("@");
    if (lastAt !== -1 && lastAt === v.length - 1) {
      setMentionOpen(true);
      setMentionQuery("");
    } else if (lastAt !== -1) {
      const afterAt = v.slice(lastAt + 1);
      if (!afterAt.includes(" ") && afterAt.length <= 20) {
        setMentionOpen(true);
        setMentionQuery(afterAt);
      } else {
        setMentionOpen(false);
      }
    } else {
      setMentionOpen(false);
    }
  };

  const insertMention = (name: string) => {
    const lastAt = text.lastIndexOf("@");
    const newText = text.slice(0, lastAt) + `@${name} `;
    setText(newText);
    setMentionOpen(false);
    textareaRef.current?.focus();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={cn(
            "size-8 p-0 relative",
            variant === "ghost" && "text-muted-foreground hover:text-amber-600",
            className
          )}
          title="کامنت‌ها"
        >
          <MessageSquare className="size-3.5" />
          {unresolvedCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-amber-500 text-white text-[8px] flex items-center justify-center font-bold">
              {toFa(unresolvedCount)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        className="w-80 sm:w-96 p-0"
        sideOffset={4}
      >
        <div className="border-b p-3 bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="size-4 text-amber-600" />
              <span className="text-xs font-bold">کامنت‌ها</span>
              {entityLabel && (
                <Badge variant="outline" className="text-[10px] h-5">
                  {entityLabel}
                </Badge>
              )}
            </div>
            <Badge variant="secondary" className="text-[10px] h-5">
              {toFa(comments.length)} کامنت
            </Badge>
          </div>
        </div>

        <ScrollArea className="h-72">
          <div className="p-3 space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-md bg-muted/40 animate-pulse"
                  />
                ))}
              </div>
            ) : !comments.length ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <MessageSquare className="size-8 mx-auto mb-2 text-amber-300" />
                کامنتی ثبت نشده
                <br />
                اولین کامنت را اضافه کنید
              </div>
            ) : (
              rootComments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  replies={repliesOf(c.id)}
                  onReply={() => setReplyTo(c.id)}
                  onToggleResolve={() => toggleResolve.mutate(c.id)}
                  onDelete={() => deleteComment.mutate(c.id)}
                  onInsertMention={insertMention}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* فرم افزودن کامنت */}
        <div className="border-t p-2 bg-card">
          {replyTo && (
            <div className="text-[10px] text-muted-foreground flex items-center justify-between mb-1 px-1">
              <span>
                پاسخ به:{" "}
                {comments.find((c) => c.id === replyTo)?.userName || "کامنت"}
              </span>
              <button
                onClick={() => setReplyTo(null)}
                className="hover:text-rose-500"
              >
                <X className="size-3" />
              </button>
            </div>
          )}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="کامنت بنویسید... (@ برای mention)"
              className="text-xs min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  if (text.trim()) {
                    createComment.mutate({
                      content: text.trim(),
                      mentions: extractMentions(text),
                      parentCommentId: replyTo,
                    });
                  }
                }
              }}
            />
            {mentionOpen && usersData?.users && (
              <div className="absolute bottom-full mb-1 left-0 right-0 bg-card border rounded-md shadow-lg max-h-40 overflow-y-auto z-10">
                {usersData.users
                  .filter(
                    (u) =>
                      u.id !== CURRENT_USER_ID &&
                      u.name.includes(mentionQuery)
                  )
                  .slice(0, 5)
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => insertMention(u.name)}
                      className="w-full text-right px-2 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs flex items-center gap-2"
                    >
                      <AtSign className="size-3 text-amber-500" />
                      <span>{u.name}</span>
                      <Badge variant="outline" className="text-[9px] h-4 mr-auto">
                        {u.role}
                      </Badge>
                    </button>
                  ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-muted-foreground">
              Ctrl+Enter برای ارسال
            </span>
            <Button
              size="sm"
              className="h-7 px-2 text-[11px] bg-amber-600 hover:bg-amber-700"
              disabled={!text.trim() || createComment.isPending}
              onClick={() =>
                text.trim() &&
                createComment.mutate({
                  content: text.trim(),
                  mentions: extractMentions(text),
                  parentCommentId: replyTo,
                })
              }
            >
              <Send className="size-3" />
              ارسال
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CommentItem({
  comment,
  replies,
  onReply,
  onToggleResolve,
  onDelete,
  onInsertMention,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: () => void;
  onToggleResolve: () => void;
  onDelete: () => void;
  onInsertMention: (name: string) => void;
}) {
  const isMe = comment.userId === CURRENT_USER_ID;
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "p-2 rounded-md border",
          comment.resolved
            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
            : "bg-card"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <Avatar className="size-6">
            <AvatarFallback
              className={cn(
                "text-[10px]",
                isMe
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              )}
            >
              {initials(comment.userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold truncate">
              {comment.userName}
              {isMe && (
                <span className="text-[9px] text-muted-foreground mr-1">
                  (شما)
                </span>
              )}
            </div>
            <div className="text-[9px] text-muted-foreground">
              {relativeTime(comment.createdAt)}
            </div>
          </div>
          {comment.resolved && (
            <Badge className="text-[9px] h-4 bg-emerald-600">حل‌شده</Badge>
          )}
        </div>
        <div className="text-xs leading-relaxed">
          {renderContent(comment.content, onInsertMention)}
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-muted-foreground"
            onClick={onReply}
          >
            <Reply className="size-3" />
            پاسخ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-muted-foreground"
            onClick={onToggleResolve}
          >
            <Check className="size-3" />
            {comment.resolved ? "بازگشایی" : "حل‌شده"}
          </Button>
          {isMe && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px] text-rose-500 hover:text-rose-600"
              onClick={onDelete}
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      </div>
      {replies.length > 0 && (
        <div className="pr-4 border-r-2 border-amber-100 dark:border-amber-900 space-y-2">
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              replies={[]}
              onReply={onReply}
              onToggleResolve={() => {}}
              onDelete={() => {}}
              onInsertMention={onInsertMention}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function renderContent(
  content: string,
  onInsertMention: (name: string) => void
) {
  // تقسیم محتوا بر اساس @mentions
  const parts = content.split(/(@[\u0600-\u06FF\s]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={i}
          className="inline-flex items-center gap-0.5 px-1 mx-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-medium cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/60"
          onClick={() => onInsertMention(part.slice(1).trim())}
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
