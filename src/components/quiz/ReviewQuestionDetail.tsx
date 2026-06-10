import { CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { AnswerOptionRow } from "@/components/quiz/AnswerOptionRow";
import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { QuestionExplanation } from "@/components/quiz/QuestionExplanation";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  isOptionCorrect,
  isOptionIncorrectSelection,
  isOptionSelected,
} from "@/lib/quizReview";
import { getQuestionOptions, questionTypeHint } from "@/lib/quizDisplay";
import { cn } from "@/lib/utils";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

export function ReviewQuestionDetail({
  question,
  index,
  record,
  className,
  variant = "review",
  showExplanation = true,
  compact = false,
}: {
  question: QuizQuestion;
  index: number;
  record?: AnswerRecord;
  className?: string;
  variant?: "review" | "preview";
  showExplanation?: boolean;
  compact?: boolean;
}) {
  const isPreview = variant === "preview";
  const [showAnswers, setShowAnswers] = useState(false);
  const options = getQuestionOptions(question);

  const revealAnswers = isPreview && showAnswers;

  return (
    <article
      id={`review-question-${index}`}
      className={cn(
        "scroll-mt-4 rounded-lg border border-zinc-200 bg-white",
        compact ? "p-3" : "p-4 sm:p-5",
        className,
      )}
    >
      <div className={cn("flex items-start", compact ? "gap-2" : "gap-3")}>
        <span className="grid-center size-6 shrink-0 rounded-md bg-zinc-200 text-xs font-semibold tabular-nums text-zinc-700">
          {index + 1}
        </span>
        <div className={cn("min-w-0 flex-1", compact ? "space-y-2" : "space-y-3")}>
          {isPreview ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {questionTypeHint(question.type)}
              </p>
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`show-answers-${index}`}
                  className="text-xs font-medium text-zinc-600"
                >
                  Show answer
                </label>
                <Switch
                  id={`show-answers-${index}`}
                  checked={showAnswers}
                  onCheckedChange={setShowAnswers}
                  aria-labelledby={`show-answers-${index}`}
                />
              </div>
            </div>
          ) : (
            record && (
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
            )
          )}

          <div
            className={cn(
              "font-semibold leading-snug text-zinc-950",
              compact ? "text-sm" : "text-sm sm:text-base",
            )}
          >
            <MarkdownContent>{question.prompt}</MarkdownContent>
          </div>

          <div className={compact ? "space-y-1.5" : "space-y-2"}>
            {options.map((option, optionIndex) => (
              <AnswerOptionRow
                key={`${optionIndex}-${option}`}
                index={optionIndex}
                text={option}
                selected={
                  isPreview || !record
                    ? false
                    : isOptionSelected(question, record.answer, optionIndex)
                }
                multiple={question.type === "multiple_choice"}
                locked
                isCorrectAnswer={
                  revealAnswers || (!isPreview && record)
                    ? isOptionCorrect(question, optionIndex)
                    : false
                }
                isIncorrectSelection={
                  !isPreview && record
                    ? isOptionIncorrectSelection(question, record.answer, optionIndex)
                    : false
                }
                onSelect={() => {}}
              />
            ))}
          </div>

          {showExplanation && question.explanation && (!isPreview || showAnswers) && (
            <QuestionExplanation explanation={question.explanation} compact={compact} />
          )}
        </div>
      </div>
    </article>
  );
}
