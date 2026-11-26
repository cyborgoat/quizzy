import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { statusStyles, type QuizDisplayStatus } from "@/components/quiz/quizStatusStyles";

export function QuizStatusBadge({
  status,
  className,
}: {
  status: QuizDisplayStatus;
  className?: string;
}) {
  const { t } = useI18n();
  const presentation = statusStyles[status];
  return (
    <Badge className={cn("whitespace-nowrap", presentation.className, className)}>
      {t(presentation.labelKey)}
    </Badge>
  );
}
