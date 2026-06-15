import { Flag } from "lucide-react";
import { AnswerOptionRow } from "@/components/quiz/AnswerOptionRow";
import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { toggleOutlineButtonClass } from "@/components/ui/button";
import { getQuestionOptions, questionTypeHint } from "@/lib/quizDisplay";
import { isOptionSelected } from "@/lib/quizReview";
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
  const options = getQuestionOptions(question);

  return (
    <section aria-labelledby="question-prompt">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {questionTypeHint(question.type)}
        </p>
        <IconActionButton
          icon={Flag}
          label={flagged ? "Unflag" : "Flag"}
          variant="outline"
          className={toggleOutlineButtonClass(flagged)}
          aria-pressed={flagged}
          onClick={onToggleFlag}
        />
      </div>
      <div
        id="question-prompt"
        className="mt-2 text-base font-medium leading-snug text-zinc-950 sm:text-lg"
      >
        <MarkdownContent>{question.prompt}</MarkdownContent>
      </div>
      <div className="mt-5 space-y-2" role="group" aria-labelledby="question-prompt">
        {options.map((option, index) => (
          <AnswerOptionRow
            key={`${index}-${option}`}
            index={index}
            text={option}
            selected={isOptionSelected(question, answer, index)}
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
