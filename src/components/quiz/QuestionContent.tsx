import { Flag } from "lucide-react";
import { AnswerOptionRow } from "@/components/quiz/AnswerOptionRow";
import { Button } from "@/components/ui/button";
import type { QuizQuestion, SubmittedAnswer } from "@/types/quiz";

export function QuestionContent({
  question,
  answer,
  flagged,
  onToggleFlag,
  onSingle,
  onMultiple,
  onTrueFalse,
}: {
  question: QuizQuestion;
  answer?: SubmittedAnswer;
  flagged: boolean;
  onToggleFlag: () => void;
  onSingle: (index: number) => void;
  onMultiple: (index: number) => void;
  onTrueFalse: (answer: boolean) => void;
}) {
  const options = question.type === "true_false" ? ["True", "False"] : question.options;
  const selected = (index: number) => {
    if (question.type === "single_choice" && answer?.type === "single_choice") {
      return answer.selectedIndex === index;
    }
    if (question.type === "multiple_choice" && answer?.type === "multiple_choice") {
      return answer.selectedIndices.includes(index);
    }
    if (question.type === "true_false" && answer?.type === "true_false") {
      return answer.selectedAnswer === (index === 0);
    }
    return false;
  };

  return (
    <section aria-labelledby="question-prompt">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {question.type === "multiple_choice"
            ? "Select all answers that apply"
            : question.type === "true_false"
              ? "True or false"
              : "Select one answer"}
        </p>
        <Button
          variant={flagged ? "default" : "outline"}
          size="sm"
          aria-pressed={flagged}
          onClick={onToggleFlag}
        >
          <Flag className="size-4" />
          {flagged ? "Flagged for review" : "Flag for review"}
        </Button>
      </div>
      <h1
        id="question-prompt"
        className="mt-2 text-base font-medium leading-snug text-zinc-950 sm:text-lg"
      >
        {question.prompt}
      </h1>
      <div className="mt-5 space-y-2" role="group" aria-labelledby="question-prompt">
        {options.map((option, index) => (
          <AnswerOptionRow
            key={`${index}-${option}`}
            index={index}
            text={option}
            selected={selected(index)}
            multiple={question.type === "multiple_choice"}
            locked={false}
            isCorrectAnswer={false}
            isIncorrectSelection={false}
            onSelect={() => {
              if (question.type === "single_choice") onSingle(index);
              else if (question.type === "multiple_choice") onMultiple(index);
              else onTrueFalse(index === 0);
            }}
          />
        ))}
      </div>
    </section>
  );
}
