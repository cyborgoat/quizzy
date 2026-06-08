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
        "mx-auto w-full py-[var(--app-page-py)]",
        pageShellPaddingClass,
        pageShellWidthClass[width],
        className,
      )}
    >
      {children}
    </main>
  );
}
