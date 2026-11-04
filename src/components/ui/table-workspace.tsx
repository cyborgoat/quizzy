import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const tableWorkspaceHeaderClass = "sticky top-0 z-10 bg-zinc-50";
export const tableWorkspaceScrollClass =
  "h-full overflow-auto [scrollbar-gutter:stable]";

/** A flat table surface with a stable toolbar, scrollable body, and pinned pagination. */
export function TableWorkspace({
  title,
  count,
  actions,
  footer,
  children,
  className,
}: {
  title: string;
  count: number;
  actions?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={cn("flex min-h-0 flex-1 flex-col", className)}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 py-2">
        <h2 id={titleId} className="text-xs font-semibold text-zinc-700">
          {title}{" "}
          <span className="font-normal tabular-nums text-zinc-500">
            ({count})
          </span>
        </h2>
        {actions}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
      <div className="shrink-0 overflow-x-auto [&>div]:min-w-max">{footer}</div>
    </section>
  );
}
