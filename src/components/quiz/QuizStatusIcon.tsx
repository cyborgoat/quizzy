import { Archive, Circle, CircleCheck, CircleDashed, type LucideIcon } from "lucide-react";
import {
  statusStyles,
  type QuizDisplayStatus,
} from "@/components/quiz/quizStatusStyles";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const statusIcons: Record<QuizDisplayStatus, { icon: LucideIcon; className: string }> = {
  "not-started": { icon: Circle, className: "text-zinc-400" },
  "in-progress": { icon: CircleDashed, className: "text-blue-600" },
  "target-reached": { icon: CircleCheck, className: "text-emerald-600" },
  archived: { icon: Archive, className: "text-zinc-500" },
};

export function QuizStatusIcon({ status }: { status: QuizDisplayStatus }) {
  const { icon: Icon, className } = statusIcons[status];
  const { label } = statusStyles[status];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={label}
          tabIndex={0}
          className="inline-flex size-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          <Icon className={cn("size-4", className)} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
