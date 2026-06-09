import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  pageShellPaddingClass,
  pageShellWidthClass,
  type PageShellWidth,
} from "@/components/layout/pageShellClasses";

export type { PageShellWidth };

export function PageShell({
  width = "wide",
  className,
  children,
}: {
  width?: PageShellWidth;
  className?: string;
  children: ReactNode;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full min-w-0 max-w-full overflow-x-hidden py-[var(--app-page-py)]",
        pageShellPaddingClass,
        pageShellWidthClass[width],
        className,
      )}
    >
      {children}
    </main>
  );
}
