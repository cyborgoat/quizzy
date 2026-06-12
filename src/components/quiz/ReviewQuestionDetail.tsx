import { CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AnswerOptionRow } from "@/components/quiz/AnswerOptionRow";
import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { QuestionExplanation } from "@/components/quiz/QuestionExplanation";
import { Button } from "@/components/ui/button";
import {
  isOptionCorrect,
  isOptionIncorrectSelection,
  isOptionSelected,
} from "@/lib/quizReview";
import { getQuestionOptions, questionTypeHint } from "@/lib/quizDisplay";
import { isAnswerCorrect } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { AnswerRecord, QuizQuestion, SubmittedAnswer } from "@/types/quiz";

function hasStudyAnswer(question: QuizQuestion, answer?: SubmittedAnswer) {
  if (!answer || question.type !== answer.type) return false;
  if (answer.type === "multiple_choice") return answer.selectedIndices.length > 0;
  return true;
}

function selectStudyAnswer(
  question: QuizQuestion,
  current: SubmittedAnswer | undefined,
  index: number,
): SubmittedAnswer | undefined {
  if (question.type === "single_choice") {
    return { type: "single_choice", selectedIndex: index };
  }

  if (question.type === "multiple_choice") {
    const selected =
      current?.type === "multiple_choice" ? current.selectedIndices : [];
    const next = selected.includes(index)
      ? selected.filter((value) => value !== index)
      : [...selected, index].sort((left, right) => left - right);
    return next.length > 0
      ? { type: "multiple_choice", selectedIndices: next }
      : undefined;
  }

  return { type: "true_false", selectedAnswer: index === 0 };
}

export function ReviewQuestionDetail({
  question,
  index,
  record,
  className,
  concealAnswers = false,
  showExplanation = true,
  compact = false,
  onStudyRevealChange,
}: {
  question: QuizQuestion;
  index: number;
  record?: AnswerRecord;
  className?: string;
  concealAnswers?: boolean;
  showExplanation?: boolean;
  compact?: boolean;
  onStudyRevealChange?: (revealed: boolean) => void;
}) {
  const [studyAnswer, setStudyAnswer] = useState<SubmittedAnswer | undefined>();
  const [studySubmitted, setStudySubmitted] = useState(false);

  useEffect(() => {
    onStudyRevealChange?.(!concealAnswers || studySubmitted);
  }, [concealAnswers, onStudyRevealChange, studySubmitted]);

  const revealed = !concealAnswers || studySubmitted;
  const activeAnswer = revealed && concealAnswers ? studyAnswer : record?.answer;
  const studyIsCorrect =
    studySubmitted && studyAnswer ? isAnswerCorrect(question, studyAnswer) : false;
  const options = getQuestionOptions(question);

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
        <span
          className="grid-center size-6 shrink-0 rounded-md border border-zinc-200 bg-zinc-200 text-xs font-semibold tabular-nums text-zinc-700"
          aria-label={`Question ${index + 1}`}
        >
          {index + 1}
        </span>
        <div className={cn("min-w-0 flex-1", compact ? "space-y-2" : "space-y-3")}>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {questionTypeHint(question.type)}
          </p>

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
                  concealAnswers && !studySubmitted
                    ? isOptionSelected(question, studyAnswer, optionIndex)
                    : revealed
                      ? isOptionSelected(question, activeAnswer, optionIndex)
                      : false
                }
                multiple={question.type === "multiple_choice"}
                locked={!concealAnswers || studySubmitted}
                isCorrectAnswer={
                  revealed ? isOptionCorrect(question, optionIndex) : false
                }
                isIncorrectSelection={
                  revealed
                    ? isOptionIncorrectSelection(question, activeAnswer, optionIndex)
                    : false
                }
                onSelect={() => {
                  if (!concealAnswers || studySubmitted) return;
                  setStudyAnswer((current) => selectStudyAnswer(question, current, optionIndex));
                }}
              />
            ))}
          </div>

          {concealAnswers && !studySubmitted && (
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={!hasStudyAnswer(question, studyAnswer)}
                onClick={() => setStudySubmitted(true)}
              >
                Submit
              </Button>
            </div>
          )}

          {concealAnswers && studySubmitted && (
            <p
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                studyIsCorrect ? "text-emerald-700" : "text-red-600",
              )}
            >
              {studyIsCorrect ? (
                <>
                  <CheckCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  Correct
                </>
              ) : (
                <>
                  <XCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  Incorrect
                </>
              )}
            </p>
          )}

          {showExplanation && question.explanation && revealed && (
            <QuestionExplanation explanation={question.explanation} />
          )}
        </div>
      </div>
    </article>
  );
}
