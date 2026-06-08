import { useMemo } from "react";
import { QuestionReviewList } from "@/components/quiz/QuestionReviewList";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

export function ReviewSummary({
  questions,
  answers,
}: {
  questions: QuizQuestion[];
  answers: AnswerRecord[];
}) {
  const answerByQuestionId = useMemo(
    () => new Map(answers.map((answer) => [answer.questionId, answer])),
    [answers],
  );

  const items = useMemo(
    () =>
      questions.flatMap((question, index) => {
        const record = answerByQuestionId.get(question.id);
        if (!record) return [];
        return [{ question, index, record }];
      }),
    [questions, answerByQuestionId],
  );

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold text-zinc-950">Answer review</h2>
      <div className="mt-4">
        <QuestionReviewList items={items} resetKey={questions.map((q) => q.id).join(",")} />
      </div>
    </section>
  );
}
