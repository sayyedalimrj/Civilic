/**
 * payment-certificate.ts — ماشین حالت گردش‌کار صورت‌وضعیت موقت (۱۳ حالته)
 *
 * مرجع: ماده ۳۷ شرایط عمومی پیمان — چرخه‌ی تهیه/رسیدگی/تأیید/پرداخت.
 * این ماژول source-of-truth گردش‌کار است. روی Payment.status (String) نگاشت می‌شود.
 */

import type { Permission, PartyType } from "@/lib/auth/permissions";

export type PaymentState =
  | "DRAFT"
  | "SUBMITTED_BY_CONTRACTOR"
  | "UNDER_CONSULTANT_REVIEW"
  | "RETURNED_BY_CONSULTANT"
  | "RESUBMITTED_BY_CONTRACTOR"
  | "APPROVED_BY_CONSULTANT"
  | "SUBMITTED_TO_EMPLOYER"
  | "UNDER_EMPLOYER_REVIEW"
  | "RETURNED_BY_EMPLOYER"
  | "RESUBMITTED_TO_EMPLOYER"
  | "APPROVED_BY_EMPLOYER"
  | "PAYMENT_REGISTERED"
  | "LOCKED";

export type PaymentAction =
  | "submit_to_consultant"
  | "start_consultant_review"
  | "return_by_consultant"
  | "resubmit_to_consultant"
  | "approve_by_consultant"
  | "submit_to_employer"
  | "start_employer_review"
  | "return_by_employer"
  | "resubmit_to_employer"
  | "approve_by_employer"
  | "register_payment"
  | "lock"
  | "admin_unlock";

export const STATE_LABELS_FA: Record<PaymentState, string> = {
  DRAFT: "پیش‌نویس",
  SUBMITTED_BY_CONTRACTOR: "ارسال‌شده توسط پیمانکار",
  UNDER_CONSULTANT_REVIEW: "در حال بررسی مشاور",
  RETURNED_BY_CONSULTANT: "برگشتی از مشاور",
  RESUBMITTED_BY_CONTRACTOR: "ارسال مجدد پیمانکار",
  APPROVED_BY_CONSULTANT: "تأییدشده توسط مشاور",
  SUBMITTED_TO_EMPLOYER: "ارسال‌شده به کارفرما",
  UNDER_EMPLOYER_REVIEW: "در حال بررسی کارفرما",
  RETURNED_BY_EMPLOYER: "برگشتی از کارفرما",
  RESUBMITTED_TO_EMPLOYER: "ارسال مجدد به کارفرما",
  APPROVED_BY_EMPLOYER: "تأیید نهایی کارفرما",
  PAYMENT_REGISTERED: "پرداخت ثبت‌شده",
  LOCKED: "قفل‌شده",
};

export const ACTION_LABELS_FA: Record<PaymentAction, string> = {
  submit_to_consultant: "ارسال برای مشاور",
  start_consultant_review: "شروع بررسی",
  return_by_consultant: "برگشت برای اصلاح",
  resubmit_to_consultant: "ارسال مجدد برای مشاور",
  approve_by_consultant: "تأیید و ارسال برای کارفرما",
  submit_to_employer: "ارسال برای کارفرما",
  start_employer_review: "شروع بررسی کارفرما",
  return_by_employer: "برگشت برای اصلاح",
  resubmit_to_employer: "ارسال مجدد به کارفرما",
  approve_by_employer: "تأیید نهایی",
  register_payment: "ثبت پرداخت",
  lock: "قفل سند",
  admin_unlock: "بازگشایی اداری",
};

export interface TransitionRule {
  from: PaymentState;
  action: PaymentAction;
  to: PaymentState;
  /** مجوز لازم در permissions.ts */
  permission: Permission;
  /** طرف مجاز به انجام (برای پیام و اعتبارسنجی) */
  byParty: PartyType;
  /** آیا یادداشت/دلیل الزامی است (مثل برگشت) */
  requiresNote: boolean;
  /** طرف مسئول بعدی (برای notification) */
  nextResponsible: PartyType | null;
  /** نوع اقدام workflow برای ثبت در WorkflowAction/Audit */
  workflowAction: "SUBMIT" | "REVIEW" | "RETURN" | "APPROVE" | "REGISTER" | "LOCK" | "UNLOCK";
  /** متن پیام سیستمی در کانال صورت‌وضعیت */
  systemMessage: (ctx: { periodNo: number; actorName: string }) => string;
}

const t = (r: TransitionRule) => r;

export const TRANSITIONS: TransitionRule[] = [
  t({
    from: "DRAFT", action: "submit_to_consultant", to: "SUBMITTED_BY_CONTRACTOR",
    permission: "payment.submit_to_consultant", byParty: "CONTRACTOR", requiresNote: false,
    nextResponsible: "CONSULTANT", workflowAction: "SUBMIT",
    systemMessage: ({ periodNo, actorName }) => `صورت‌وضعیت شماره ${periodNo} توسط ${actorName} برای مشاور ارسال شد.`,
  }),
  t({
    from: "SUBMITTED_BY_CONTRACTOR", action: "start_consultant_review", to: "UNDER_CONSULTANT_REVIEW",
    permission: "payment.return_to_contractor", byParty: "CONSULTANT", requiresNote: false,
    nextResponsible: "CONSULTANT", workflowAction: "REVIEW",
    systemMessage: ({ periodNo, actorName }) => `بررسی صورت‌وضعیت شماره ${periodNo} توسط ${actorName} (مشاور) آغاز شد.`,
  }),
  t({
    from: "UNDER_CONSULTANT_REVIEW", action: "return_by_consultant", to: "RETURNED_BY_CONSULTANT",
    permission: "payment.return_to_contractor", byParty: "CONSULTANT", requiresNote: true,
    nextResponsible: "CONTRACTOR", workflowAction: "RETURN",
    systemMessage: ({ periodNo, actorName }) => `صورت‌وضعیت شماره ${periodNo} توسط ${actorName} (مشاور) برای اصلاح برگشت داده شد.`,
  }),
  t({
    from: "RETURNED_BY_CONSULTANT", action: "resubmit_to_consultant", to: "RESUBMITTED_BY_CONTRACTOR",
    permission: "payment.submit_to_consultant", byParty: "CONTRACTOR", requiresNote: false,
    nextResponsible: "CONSULTANT", workflowAction: "SUBMIT",
    systemMessage: ({ periodNo, actorName }) => `صورت‌وضعیت شماره ${periodNo} پس از اصلاح توسط ${actorName} دوباره ارسال شد.`,
  }),
  // اجازه‌ی شروع بررسی روی نسخه‌ی ارسال‌مجدد
  t({
    from: "RESUBMITTED_BY_CONTRACTOR", action: "start_consultant_review", to: "UNDER_CONSULTANT_REVIEW",
    permission: "payment.return_to_contractor", byParty: "CONSULTANT", requiresNote: false,
    nextResponsible: "CONSULTANT", workflowAction: "REVIEW",
    systemMessage: ({ periodNo, actorName }) => `بررسی مجدد صورت‌وضعیت شماره ${periodNo} توسط ${actorName} آغاز شد.`,
  }),
  t({
    from: "UNDER_CONSULTANT_REVIEW", action: "approve_by_consultant", to: "APPROVED_BY_CONSULTANT",
    permission: "payment.approve_consultant", byParty: "CONSULTANT", requiresNote: false,
    nextResponsible: "CONSULTANT", workflowAction: "APPROVE",
    systemMessage: ({ periodNo, actorName }) => `صورت‌وضعیت شماره ${periodNo} توسط ${actorName} (مشاور) تأیید شد.`,
  }),
  t({
    from: "APPROVED_BY_CONSULTANT", action: "submit_to_employer", to: "SUBMITTED_TO_EMPLOYER",
    permission: "payment.submit_to_employer", byParty: "CONSULTANT", requiresNote: false,
    nextResponsible: "EMPLOYER", workflowAction: "SUBMIT",
    systemMessage: ({ periodNo, actorName }) => `صورت‌وضعیت شماره ${periodNo} توسط ${actorName} برای کارفرما ارسال شد.`,
  }),
  t({
    from: "SUBMITTED_TO_EMPLOYER", action: "start_employer_review", to: "UNDER_EMPLOYER_REVIEW",
    permission: "payment.return_by_employer", byParty: "EMPLOYER", requiresNote: false,
    nextResponsible: "EMPLOYER", workflowAction: "REVIEW",
    systemMessage: ({ periodNo, actorName }) => `بررسی صورت‌وضعیت شماره ${periodNo} توسط ${actorName} (کارفرما) آغاز شد.`,
  }),
  t({
    from: "UNDER_EMPLOYER_REVIEW", action: "return_by_employer", to: "RETURNED_BY_EMPLOYER",
    permission: "payment.return_by_employer", byParty: "EMPLOYER", requiresNote: true,
    nextResponsible: "CONTRACTOR", workflowAction: "RETURN",
    systemMessage: ({ periodNo, actorName }) => `صورت‌وضعیت شماره ${periodNo} توسط ${actorName} (کارفرما) برای اصلاح برگشت داده شد.`,
  }),
  t({
    from: "RETURNED_BY_EMPLOYER", action: "resubmit_to_employer", to: "RESUBMITTED_TO_EMPLOYER",
    permission: "payment.submit_to_consultant", byParty: "CONTRACTOR", requiresNote: false,
    nextResponsible: "EMPLOYER", workflowAction: "SUBMIT",
    systemMessage: ({ periodNo, actorName }) => `صورت‌وضعیت شماره ${periodNo} پس از اصلاح توسط ${actorName} دوباره به کارفرما ارسال شد.`,
  }),
  t({
    from: "RESUBMITTED_TO_EMPLOYER", action: "start_employer_review", to: "UNDER_EMPLOYER_REVIEW",
    permission: "payment.return_by_employer", byParty: "EMPLOYER", requiresNote: false,
    nextResponsible: "EMPLOYER", workflowAction: "REVIEW",
    systemMessage: ({ periodNo, actorName }) => `بررسی مجدد صورت‌وضعیت شماره ${periodNo} توسط ${actorName} آغاز شد.`,
  }),
  t({
    from: "UNDER_EMPLOYER_REVIEW", action: "approve_by_employer", to: "APPROVED_BY_EMPLOYER",
    permission: "payment.approve_employer", byParty: "EMPLOYER", requiresNote: false,
    nextResponsible: "EMPLOYER", workflowAction: "APPROVE",
    systemMessage: ({ periodNo, actorName }) => `صورت‌وضعیت شماره ${periodNo} توسط ${actorName} (کارفرما) تأیید نهایی شد.`,
  }),
  t({
    from: "APPROVED_BY_EMPLOYER", action: "register_payment", to: "PAYMENT_REGISTERED",
    permission: "payment.register_payment", byParty: "EMPLOYER", requiresNote: false,
    nextResponsible: "EMPLOYER", workflowAction: "REGISTER",
    systemMessage: ({ periodNo, actorName }) => `پرداخت صورت‌وضعیت شماره ${periodNo} توسط ${actorName} ثبت شد.`,
  }),
  t({
    from: "PAYMENT_REGISTERED", action: "lock", to: "LOCKED",
    permission: "payment.lock", byParty: "EMPLOYER", requiresNote: false,
    nextResponsible: null, workflowAction: "LOCK",
    systemMessage: ({ periodNo, actorName }) => `صورت‌وضعیت شماره ${periodNo} توسط ${actorName} قفل شد.`,
  }),
  t({
    from: "LOCKED", action: "admin_unlock", to: "PAYMENT_REGISTERED",
    permission: "payment.lock", byParty: "EMPLOYER", requiresNote: true,
    nextResponsible: "EMPLOYER", workflowAction: "UNLOCK",
    systemMessage: ({ periodNo, actorName }) => `قفل صورت‌وضعیت شماره ${periodNo} توسط ${actorName} با مجوز ویژه بازگشایی شد.`,
  }),
];

/** حالت‌هایی که برای پیمانکار قابل ویرایش‌اند */
export const CONTRACTOR_EDITABLE_STATES: PaymentState[] = ["DRAFT", "RETURNED_BY_CONSULTANT", "RETURNED_BY_EMPLOYER"];

export function isEditableByContractor(state: PaymentState): boolean {
  return CONTRACTOR_EDITABLE_STATES.includes(state);
}

export function isTerminal(state: PaymentState): boolean {
  return state === "LOCKED";
}

/** قانون transition را برای یک حالت و اقدام پیدا می‌کند */
export function findTransition(from: PaymentState, action: PaymentAction): TransitionRule | undefined {
  return TRANSITIONS.find((r) => r.from === from && r.action === action);
}

/** فهرست اقدام‌های مجاز از یک حالت */
export function allowedActions(from: PaymentState): TransitionRule[] {
  return TRANSITIONS.filter((r) => r.from === from);
}

/**
 * اقدام‌های مجاز برای یک کاربر با مجموعه‌ی مجوزهای مشخص از یک حالت.
 * primaryAction اولین اقدام پیش‌برنده (نه برگشت) متناسب با نقش است.
 */
export function availableActionsForUser(
  from: PaymentState,
  permissions: Permission[],
  partyType: PartyType
): TransitionRule[] {
  return allowedActions(from).filter(
    (r) => r.byParty === partyType && permissions.includes(r.permission)
  );
}

/** ترتیب مراحل برای نمایش stepper */
export const STEPPER_STATES: PaymentState[] = [
  "DRAFT",
  "SUBMITTED_BY_CONTRACTOR",
  "UNDER_CONSULTANT_REVIEW",
  "APPROVED_BY_CONSULTANT",
  "SUBMITTED_TO_EMPLOYER",
  "UNDER_EMPLOYER_REVIEW",
  "APPROVED_BY_EMPLOYER",
  "PAYMENT_REGISTERED",
  "LOCKED",
];

export function stepIndex(state: PaymentState): number {
  // حالت‌های برگشتی/ارسال‌مجدد به مرحله‌ی منطقی نگاشت می‌شوند
  const map: Partial<Record<PaymentState, PaymentState>> = {
    RETURNED_BY_CONSULTANT: "SUBMITTED_BY_CONTRACTOR",
    RESUBMITTED_BY_CONTRACTOR: "UNDER_CONSULTANT_REVIEW",
    RETURNED_BY_EMPLOYER: "SUBMITTED_TO_EMPLOYER",
    RESUBMITTED_TO_EMPLOYER: "UNDER_EMPLOYER_REVIEW",
  };
  const eff = map[state] ?? state;
  const idx = STEPPER_STATES.indexOf(eff);
  return idx < 0 ? 0 : idx;
}
