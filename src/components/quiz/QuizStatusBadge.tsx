import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusStyles, type QuizDisplayStatus } from "@/components/quiz/quizStatusStyles";

export function QuizStatusBadge({
  status,
  className,
}: {
  status: QuizDisplayStatus;
  className?: string;
}) {
  const presentation = statusStyles[status];
  return (
    <Badge className={cn("whitespace-nowrap", presentation.className, className)}>
      {presentation.label}
    </Badge>
  );
}
