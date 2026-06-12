import * as Dialog from "@radix-ui/react-dialog";
import { useMemo } from "react";
import {
  ResizableDialogShell,
  type DialogStackLayer,
} from "@/components/ui/resizable-dialog-shell";
import { knowledgeDialogCloseButtonClassName } from "@/components/knowledge/knowledgeStyles";
import { ReviewQuestionSplitPanel } from "@/components/quiz/ReviewQuestionSplitPanel";
import { UnavailableQuestionAlert } from "@/components/quiz/UnavailableQuestionMessage";
import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { sectionLabelClassName } from "@/components/ui/section-label";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { formatQuizQuestionLabel } from "@/lib/linkedQuestionLabel";
import { resolveLinkedQuestion } from "@/lib/linkedQuestionLookup";
import { getLinkWarnings } from "@/lib/knowledgeValidation";
import type { LinkedQuizQuestion } from "@/types/knowledge";

function noteDialogLayerForPreview(
  previewLayer: DialogStackLayer,
): DialogStackLayer {
  return previewLayer === "default" ? "stacked" : "elevated";
}

export function LinkedQuestionPreviewDialog({
  link,
  open,
  onOpenChange,
  currentNoteId,
  layer = "default",
}: {
  link: LinkedQuizQuestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNoteId?: string;
  layer?: DialogStackLayer;
}) {
  const { quizzes } = useQuizLibrary();

  const resolved = useMemo(
    () => (link ? resolveLinkedQuestion(link, quizzes) : null),
    [link, quizzes],
  );

  const hasLinkWarning = useMemo(() => {
    if (!link) return false;
    return getLinkWarnings({ linkedQuizQuestions: [link] }, quizzes).length > 0;
  }, [link, quizzes]);

  const label = link ? formatQuizQuestionLabel(link, quizzes) : "";

  if (!link) return null;

  return (
    <ResizableDialogShell
      open={open}
      onOpenChange={onOpenChange}
      layer={layer}
      title="Linked question"
      description={label}
      footer={
        <Dialog.Close asChild>
          <Button
            size="sm"
            variant="ghost"
            className={knowledgeDialogCloseButtonClassName}
          >
            Close
          </Button>
        </Dialog.Close>
      }
    >
      {!resolved ? (
        <UnavailableQuestionAlert />
      ) : (
        <div className="space-y-6">
          <section className="min-w-0">
            <h2 className={sectionLabelClassName}>Quiz</h2>
            <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
              {resolved.quiz.title}
            </p>
            {resolved.quiz.description && (
              <div className="mt-3 text-sm leading-6 text-zinc-600">
                <MarkdownContent>{resolved.quiz.description}</MarkdownContent>
              </div>
            )}
          </section>

          <ReviewQuestionSplitPanel
            key={resolved.question.id}
            question={resolved.question}
            index={Math.max((resolved.questionNumber ?? 1) - 1, 0)}
            quizId={link.quizId}
            currentNoteId={currentNoteId}
            noteDialogLayer={noteDialogLayerForPreview(layer)}
          />

          {hasLinkWarning && (
            <Alert>
              <AlertTitle>Outdated link</AlertTitle>
              <AlertDescription>
                This link may be outdated because the quiz or question could not be fully
                verified.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </ResizableDialogShell>
  );
}
