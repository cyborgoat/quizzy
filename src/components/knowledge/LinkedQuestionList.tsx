import { Badge } from "@/components/ui/badge";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { formatQuizQuestionLabel } from "@/lib/linkedQuestionLabel";
import { getLinkWarnings, linkWarningKey } from "@/lib/knowledgeValidation";
import type { LinkedQuizQuestion } from "@/types/knowledge";

export function LinkedQuestionList({
  links,
}: {
  links: LinkedQuizQuestion[];
}) {
  const { quizzes } = useQuizLibrary();
  const warnings = getLinkWarnings({ linkedQuizQuestions: links }, quizzes);
  const warningKeys = new Set(warnings.map(linkWarningKey));

  if (links.length === 0) {
    return <p className="text-sm text-zinc-500">No linked questions.</p>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      {links.map((link) => {
        const hasWarning = warningKeys.has(`${link.quizId}:${link.questionId}`);
        const label = formatQuizQuestionLabel(link, quizzes);

        return (
          <Badge
            key={`${link.quizId}:${link.questionId}`}
            className={`max-w-full truncate ${hasWarning ? "border-amber-300 bg-amber-50 text-amber-900" : ""}`}
            title={label}
          >
            <span className="truncate">{label}</span>
          </Badge>
        );
      })}
    </div>
  );
}
