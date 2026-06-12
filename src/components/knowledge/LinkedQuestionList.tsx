import { useState } from "react";
import {
  LinkedQuestionPreviewDialog,
} from "@/components/knowledge/LinkedQuestionPreviewDialog";
import type { DialogStackLayer } from "@/components/ui/resizable-dialog-shell";
import { numberedListLinkClassName, NumberedListRow } from "@/components/ui/numbered-list-row";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { formatQuizQuestionLabel } from "@/lib/linkedQuestionLabel";
import { questionLinkKey } from "@/lib/knowledgeLinks";
import { getLinkWarnings } from "@/lib/knowledgeValidation";
import { cn } from "@/lib/utils";
import type { LinkedQuizQuestion } from "@/types/knowledge";

export function LinkedQuestionList({
  links,
  currentNoteId,
  previewLayer = "default",
}: {
  links: LinkedQuizQuestion[];
  currentNoteId?: string;
  previewLayer?: DialogStackLayer;
}) {
  const { quizzes } = useQuizLibrary();
  const [previewLink, setPreviewLink] = useState<LinkedQuizQuestion | null>(null);
  const warnings = getLinkWarnings({ linkedQuizQuestions: links }, quizzes);
  const warningKeys = new Set(
    warnings.map((warning) => questionLinkKey(warning.quizId, warning.questionId)),
  );

  if (links.length === 0) {
    return <p className="text-sm text-zinc-500">No linked questions.</p>;
  }

  return (
    <>
      <ol className="list-none space-y-1">
        {links.map((link, index) => {
          const key = questionLinkKey(link.quizId, link.questionId);
          const hasWarning = warningKeys.has(key);
          const label = formatQuizQuestionLabel(link, quizzes);

          return (
            <NumberedListRow key={key} index={index}>
              <button
                type="button"
                onClick={() => setPreviewLink(link)}
                title={label}
                className={cn(
                  numberedListLinkClassName,
                  hasWarning
                    ? "text-amber-800 hover:text-amber-950"
                    : undefined,
                )}
              >
                <span className="truncate">{label}</span>
              </button>
            </NumberedListRow>
          );
        })}
      </ol>

      <LinkedQuestionPreviewDialog
        link={previewLink}
        open={previewLink !== null}
        currentNoteId={currentNoteId}
        layer={previewLayer}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPreviewLink(null);
          }
        }}
      />
    </>
  );
}
