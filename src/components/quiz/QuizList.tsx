import { QuizListItem } from "@/components/quiz/QuizListItem";
import type { QuizSource } from "@/types/quiz";

export function QuizList({
  quizzes,
  onDelete,
}: {
  quizzes: QuizSource[];
  onDelete: (source: QuizSource) => void;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Available quizzes">
      {quizzes.map((source) => (
        <QuizListItem
          key={source.quiz.id}
          source={source}
          onDelete={() => onDelete(source)}
        />
      ))}
    </section>
  );
}
