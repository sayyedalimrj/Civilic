import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({ title, icon, action, children, className, bodyClassName }: SectionCardProps) {
  return (
    <section className={cn("flex flex-col overflow-hidden rounded-xl border bg-card", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            {title}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
