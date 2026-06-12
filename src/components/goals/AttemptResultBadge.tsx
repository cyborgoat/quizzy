import { cn } from "@/lib/utils";

export function AttemptResultBadge({
  passed,
  className,
}: {
  passed: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
        className,
      )}
    >
      {passed ? "Pass" : "Fail"}
    </span>
  );
}
