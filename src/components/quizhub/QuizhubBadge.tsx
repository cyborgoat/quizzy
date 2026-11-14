import { CloudDownload } from "lucide-react";
import { cn } from "@/lib/utils";

/** Marks a quiz or note that was downloaded from quizhub. */
export function QuizhubBadge({ className }: { className?: string }) {
  return (
    <span
      title="Downloaded from Quizhub"
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-sky-200 bg-sky-50 px-1.5 text-[10px] font-medium leading-4 text-sky-700",
        className,
      )}
    >
      <CloudDownload className="size-2.5" aria-hidden="true" />
      Quizhub
    </span>
  );
}
