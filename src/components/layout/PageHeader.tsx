import type { ReactNode } from "react";
import {
  pageDescriptionClassName,
  pageTitleClassName,
} from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex min-w-0 flex-wrap items-start justify-between gap-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className={pageTitleClassName}>{title}</h1>
        {description && <p className={pageDescriptionClassName}>{description}</p>}
        {children}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-1">{actions}</div>
      )}
    </header>
  );
}
