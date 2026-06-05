import { Badge } from "@/components/ui/badge";
import type { AnswerRecord, Quiz, QuizQuestion, SubmittedAnswer } from "@/types/quiz";

function answerText(question: QuizQuestion, answer?: SubmittedAnswer) {
  if (!answer) return "No answer submitted";
  if (question.type === "single_choice" && answer.type === "single_choice") {
    return question.options[answer.selectedIndex];
  }
  if (question.type === "multiple_choice" && answer.type === "multiple_choice") {
    return answer.selectedIndices.map((index) => question.options[index]).join(", ");
  }
  if (question.type === "true_false" && answer.type === "true_false") {
    return answer.selectedAnswer ? "True" : "False";
  }
  return "Unavailable";
}

function correctText(question: QuizQuestion) {
  if (question.type === "single_choice") return question.options[question.answerIndex];
  if (question.type === "multiple_choice") {
    return question.answerIndices.map((index) => question.options[index]).join(", ");
  }
  return question.answer ? "True" : "False";
}

export function ReviewSummary({
  quiz,
  answers,
}: {
  quiz: Quiz;
  answers: AnswerRecord[];
}) {
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold text-zinc-950">Answer review</h2>
      <div className="mt-4 space-y-4">
        {quiz.questions.map((question, index) => {
          const record = answers.find((answer) => answer.questionId === question.id);
          if (!record) return null;
          const unanswered = !record.answer;
          return (
            <article key={question.id} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold leading-6 text-zinc-950">
                  {index + 1}. {question.prompt}
                </h3>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  {record.flagged && (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-800">
                      Flagged
                    </Badge>
                  )}
                  <Badge
                    className={
                      record.isCorrect
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : unanswered
                          ? "border-zinc-300 bg-zinc-100 text-zinc-700"
                          : "border-red-200 bg-red-50 text-red-800"
                    }
                  >
                    {record.isCorrect
                      ? "Correct"
                      : unanswered
                        ? "Unanswered"
                        : "Incorrect"}
                  </Badge>
                </div>
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="font-medium text-zinc-500">Your answer</dt>
                  <dd className="mt-1 leading-6 text-zinc-900">{answerText(question, record.answer)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Correct answer</dt>
                  <dd className="mt-1 leading-6 text-zinc-900">{correctText(question)}</dd>
                </div>
                {question.explanation && (
                  <div>
                    <dt className="font-medium text-zinc-500">Explanation</dt>
                    <dd className="mt-1 leading-6 text-zinc-700">{question.explanation}</dd>
                  </div>
                )}
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
