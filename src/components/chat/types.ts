"use client";

// ─── Shared types & constants for collaboration module ───
// کاربر جاری در نسخه‌ی دمو: سید علی میرجعفری (ADMIN)
export const CURRENT_USER_ID = "user-admin";
export const CURRENT_USER_NAME = "سید علی میرجعفری";
export const CURRENT_USER_ROLE = "ADMIN";

export interface ChatUser {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
}

export interface ChatThreadListItem {
  id: string;
  tenantId: string;
  participantIds: string[];
  participants: ChatUser[];
  lastMessageAt: string;
  createdAt: string;
  lastMessage: {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    readBy: string[];
    createdAt: string;
  } | null;
}

export interface ChatMessageItem {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: string | null;
  content: string;
  readBy: string[];
  createdAt: string;
}

export interface ChatThreadDetail {
  thread: {
    id: string;
    participantIds: string[];
    participants: ChatUser[];
    lastMessageAt: string;
  };
  messages: ChatMessageItem[];
}

export interface CommentItem {
  id: string;
  tenantId: string;
  projectId: string;
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

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  DETAIL_BOQ: "ردیف ریزمتره",
  FINANCIAL_SHEET: "ردیف برگه مالی",
  PAYMENT: "صورت‌وضعیت",
  CHAPTER: "فصل",
  PROJECT: "پروژه",
};

/** زمان نسبی فارسی */
export function relativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  if (diff < 0) return "همین الان";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) {
    const fa = String(mins).replace(/[0-9]/g, (x) => "۰۱۲۳۴۵۶۷۸۹"[+x]);
    return `${fa} دقیقه پیش`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    const fa = String(hrs).replace(/[0-9]/g, (x) => "۰۱۲۳۴۵۶۷۸۹"[+x]);
    return `${fa} ساعت پیش`;
  }
  const days = Math.floor(hrs / 24);
  const fa = String(days).replace(/[0-9]/g, (x) => "۰۱۲۳۴۵۶۷۸۹"[+x]);
  return `${fa} روز پیش`;
}

/** نمایش زمان کوتاه: ساعت:دقیقه */
export function shortTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const fa = (hh + ":" + mm).replace(/[0-9]/g, (x) => "۰۱۲۳۴۵۶۷۸۹"[+x]);
  return fa;
}
