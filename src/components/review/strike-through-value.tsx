import { cn } from "@/lib/utils";
import { faMoney } from "@/lib/fa";

interface StrikeThroughValueProps {
  value: number | null | undefined;
  /** خط‌خورده (مقدار قبلی که اصلاح شده) */
  struck?: boolean;
  className?: string;
}

/** نمایش یک مقدار ریالی؛ در صورت اصلاح‌شدن توسط لایه‌ی بالاتر، خط‌خورده نمایش داده می‌شود. */
export function StrikeThroughValue({ value, struck, className }: StrikeThroughValueProps) {
  return (
    <span className={cn("tabular-nums", struck && "text-muted-foreground line-through decoration-rose-400/70", className)}>
      {faMoney(value ?? 0)}
    </span>
  );
}
