import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function InlineEmptyMessage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500",
        className,
      )}
    >
      {children}
    </p>
  );
}
