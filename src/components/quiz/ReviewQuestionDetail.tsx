import { CheckCircle, XCircle } from "lucide-react";
import { AnswerOptionRow } from "@/components/quiz/AnswerOptionRow";
import { Badge } from "@/components/ui/badge";
import {
  isOptionCorrect,
  isOptionIncorrectSelection,
  isOptionSelected,
} from "@/lib/quizReview";
import { cn } from "@/lib/utils";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

export function ReviewQuestionDetail({
  question,
  index,
  record,
  className,
}: {
  question: QuizQuestion;
  index: number;
  record: AnswerRecord;
  className?: string;
}) {
  const options = question.type === "true_false" ? ["True", "False"] : question.options;

  return (
    <article
      id={`review-question-${index}`}
      className={cn(
        "scroll-mt-4 rounded-lg border border-zinc-200 bg-white p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid-center size-6 shrink-0 rounded-md bg-zinc-200 text-xs font-semibold tabular-nums text-zinc-700">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {record.isCorrect ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle className="size-3.5" aria-hidden />
                Correct
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                <XCircle className="size-3.5" aria-hidden />
                Incorrect
              </span>
            )}
            {record.flagged && (
              <Badge className="border-amber-200 bg-amber-50 text-amber-800">Flagged</Badge>
            )}
          </div>

          <h3 className="text-sm font-semibold leading-snug text-zinc-950 sm:text-base">
            {question.prompt}
          </h3>

          <div className="space-y-2">
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
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Explanation
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">{question.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
