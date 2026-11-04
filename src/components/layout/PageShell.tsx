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
  layout = "flow",
  className,
  children,
}: {
  width?: PageShellWidth;
  layout?: "flow" | "workspace";
  className?: string;
  children: ReactNode;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full min-w-0 max-w-full overflow-x-hidden py-[var(--app-page-py)]",
        pageShellPaddingClass,
        pageShellWidthClass[width],
        layout === "workspace" && "flex h-dvh min-h-0 flex-col gap-3 overflow-hidden py-3 lg:py-4",
        className,
      )}
    >
      {children}
    </main>
  );
}
