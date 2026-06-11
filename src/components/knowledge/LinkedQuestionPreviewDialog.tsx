import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useMemo } from "react";
import { ReviewQuestionSplitPanel } from "@/components/quiz/ReviewQuestionSplitPanel";
import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { formatQuizQuestionLabel } from "@/lib/linkedQuestionLabel";
import { resolveLinkedQuestion } from "@/lib/linkedQuestionLookup";
import { getLinkWarnings } from "@/lib/knowledgeValidation";
import type { LinkedQuizQuestion } from "@/types/knowledge";

export function LinkedQuestionPreviewDialog({
  link,
  open,
  onOpenChange,
  currentNoteId,
}: {
  link: LinkedQuizQuestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNoteId?: string;
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
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-zinc-950/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-70 flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-[min(100%,48rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl focus:outline-none">
          <div className="shrink-0 border-b border-zinc-100 px-6 py-4">
            <Dialog.Title className="text-lg font-semibold text-zinc-950">
              Linked question
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-zinc-500">{label}</Dialog.Description>
            <Dialog.Close asChild>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-4 text-zinc-900 hover:bg-zinc-100/60"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {!resolved ? (
              <Alert>
                <AlertTitle>Question unavailable</AlertTitle>
                <AlertDescription>
                  This question could not be loaded. The quiz or question may have been removed or
                  is unavailable in your working directory.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                <section className="min-w-0">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Quiz
                  </h2>
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
                  concealAnswers
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
          </div>

          <div className="flex shrink-0 justify-end border-t border-zinc-100 px-6 py-4">
            <Dialog.Close asChild>
              <Button size="sm" variant="ghost">
                Close
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
