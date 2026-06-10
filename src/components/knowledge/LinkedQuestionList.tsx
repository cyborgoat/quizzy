import { useState } from "react";
import { LinkedQuestionPreviewDialog } from "@/components/knowledge/LinkedQuestionPreviewDialog";
import { Badge } from "@/components/ui/badge";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { formatQuizQuestionLabel } from "@/lib/linkedQuestionLabel";
import { getLinkWarnings, linkWarningKey } from "@/lib/knowledgeValidation";
import { cn } from "@/lib/utils";
import type { LinkedQuizQuestion } from "@/types/knowledge";

export function LinkedQuestionList({
  links,
  currentNoteId,
}: {
  links: LinkedQuizQuestion[];
  currentNoteId?: string;
}) {
  const { quizzes } = useQuizLibrary();
  const [previewLink, setPreviewLink] = useState<LinkedQuizQuestion | null>(null);
  const warnings = getLinkWarnings({ linkedQuizQuestions: links }, quizzes);
  const warningKeys = new Set(warnings.map(linkWarningKey));

  if (links.length === 0) {
    return <p className="text-sm text-zinc-500">No linked questions.</p>;
  }

  return (
    <>
      <div className="flex min-w-0 flex-wrap gap-2">
        {links.map((link) => {
          const hasWarning = warningKeys.has(`${link.quizId}:${link.questionId}`);
          const label = formatQuizQuestionLabel(link, quizzes);

          return (
            <button
              key={`${link.quizId}:${link.questionId}`}
              type="button"
              onClick={() => setPreviewLink(link)}
              title={label}
              className="max-w-full rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2"
            >
              <Badge
                className={cn(
                  "max-w-full cursor-pointer transition-colors hover:bg-zinc-200/70",
                  hasWarning ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100" : "",
                )}
              >
                <span className="truncate">{label}</span>
              </Badge>
            </button>
          );
        })}
      </div>

      <LinkedQuestionPreviewDialog
        link={previewLink}
        open={previewLink !== null}
        currentNoteId={currentNoteId}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPreviewLink(null);
          }
        }}
      />
    </>
  );
}
