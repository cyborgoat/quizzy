import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KnowledgeProse({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("knowledge-prose w-full min-w-0 max-w-full", className)}>
      {children}
    </div>
  );
}
