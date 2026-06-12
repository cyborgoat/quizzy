import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const numberedListLinkClassName =
  "inline-flex min-w-0 items-center border-0 bg-transparent p-0 text-left text-zinc-800 transition-colors hover:text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2";

export function NumberedListRow({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li className={cn("flex min-w-0 items-center gap-2 text-sm leading-snug", className)}>
      <span
        className="grid-center w-6 shrink-0 font-mono text-xs tabular-nums text-zinc-400"
        aria-hidden
      >
        [{index + 1}]
      </span>
      {children}
    </li>
  );
}
