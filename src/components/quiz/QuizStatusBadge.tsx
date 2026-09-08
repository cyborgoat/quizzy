import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QuizProgressStatus } from "@/lib/quizProgress";

const statusStyles: Record<QuizProgressStatus, { label: string; className: string }> = {
  "not-started": {
    label: "Not started",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600",
  },
  "in-progress": {
    label: "In progress",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  "target-reached": {
    label: "Target reached",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  completed: {
    label: "Completed",
    className: "border-green-200 bg-green-100 text-green-800",
  },
};

export function QuizStatusBadge({
  status,
  className,
}: {
  status: QuizProgressStatus;
  className?: string;
}) {
  const presentation = statusStyles[status];
  return (
    <Badge className={cn("whitespace-nowrap", presentation.className, className)}>
      {presentation.label}
    </Badge>
  );
}
