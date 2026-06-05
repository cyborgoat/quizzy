import { AnswerOptionRow } from "@/components/quiz/AnswerOptionRow";
import type { QuizQuestion } from "@/types/quiz";

export function QuestionContent({
  question,
  selectedSingle,
  selectedMultiple,
  selectedTrueFalse,
  locked,
  onSingle,
  onMultiple,
  onTrueFalse,
}: {
  question: QuizQuestion;
  selectedSingle: number | null;
  selectedMultiple: number[];
  selectedTrueFalse: boolean | null;
  locked: boolean;
  onSingle: (index: number) => void;
  onMultiple: (index: number) => void;
  onTrueFalse: (answer: boolean) => void;
}) {
  const options = question.type === "true_false" ? ["True", "False"] : question.options;
  const selected = (index: number) => {
    if (question.type === "single_choice") return selectedSingle === index;
    if (question.type === "multiple_choice") return selectedMultiple.includes(index);
    return selectedTrueFalse === (index === 0);
  };
  const correct = (index: number) => {
    if (question.type === "single_choice") return question.answerIndex === index;
    if (question.type === "multiple_choice") return question.answerIndices.includes(index);
    return question.answer === (index === 0);
  };

  return (
    <section aria-labelledby="question-prompt">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
        {question.type === "multiple_choice"
          ? "Select all answers that apply"
          : question.type === "true_false"
            ? "True or false"
            : "Select one answer"}
      </p>
      <h1
        id="question-prompt"
        className="mt-3 text-2xl font-semibold leading-tight text-zinc-950 sm:text-3xl"
      >
        {question.prompt}
      </h1>
      <div className="mt-8 space-y-3" role="group" aria-labelledby="question-prompt">
        {options.map((option, index) => (
          <AnswerOptionRow
            key={`${index}-${option}`}
            index={index}
            text={option}
            selected={selected(index)}
            multiple={question.type === "multiple_choice"}
            locked={locked}
            isCorrectAnswer={locked && correct(index)}
            isIncorrectSelection={locked && selected(index) && !correct(index)}
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
