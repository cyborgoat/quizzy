import { Flag, X } from "lucide-react";
import { reviewQuestionIncorrectClass } from "@/lib/reviewQuestionStatus";
import { cn } from "@/lib/utils";

export function MistakeStatusBadge({
  count,
  variant,
}: {
  count: number;
  variant: "mistakes" | "flags";
}) {
  if (count <= 0) return null;

  const isMistakes = variant === "mistakes";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        isMistakes ? reviewQuestionIncorrectClass : "bg-amber-50 text-amber-800",
      )}
    >
      {isMistakes ? (
        <X className="size-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <Flag className="size-3.5 shrink-0" aria-hidden="true" />
      )}
      {count}
    </span>
  );
}
