import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnswerOptionRow } from "@/components/quiz/AnswerOptionRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  isOptionCorrect,
  isOptionIncorrectSelection,
  isOptionSelected,
} from "@/lib/quizReview";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

export function ReviewQuestionDialog({
  open,
  question,
  index,
  record,
  onClose,
}: {
  open: boolean;
  question: QuizQuestion;
  index: number;
  record: AnswerRecord;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const options = question.type === "true_false" ? ["True", "False"] : question.options;

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/50"
        aria-label="Close question review"
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-question-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Question {index + 1}
            </p>
            {record.flagged && (
              <Badge className="border-amber-200 bg-amber-50 text-amber-800">
                Flagged
              </Badge>
            )}
          </div>
          <Button
            ref={closeButtonRef}
            size="icon"
            variant="ghost"
            className="size-8 shrink-0 text-zinc-500"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <h2
            id="review-question-title"
            className="text-base font-semibold leading-snug text-zinc-950 sm:text-lg"
          >
            {question.prompt}
          </h2>

          <div className="mt-5 space-y-2" role="group" aria-labelledby="review-question-title">
            {options.map((option, optionIndex) => (
              <AnswerOptionRow
                key={`${optionIndex}-${option}`}
                index={optionIndex}
                text={option}
                selected={isOptionSelected(question, record.answer, optionIndex)}
                multiple={question.type === "multiple_choice"}
                locked
                isCorrectAnswer={isOptionCorrect(question, optionIndex)}
                isIncorrectSelection={isOptionIncorrectSelection(
                  question,
                  record.answer,
                  optionIndex,
                )}
                onSelect={() => {}}
              />
            ))}
          </div>

          {question.explanation && (
            <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Explanation
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">{question.explanation}</p>
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
