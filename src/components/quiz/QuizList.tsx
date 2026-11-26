import { QuizListItem } from "@/components/quiz/QuizListItem";
import type { QuizSource } from "@/types/quiz";
import { useI18n } from "@/lib/i18n";

export function QuizList({
  quizzes,
  onOpenDetails,
}: {
  quizzes: QuizSource[];
  onOpenDetails: (quizId: string, trigger: HTMLButtonElement) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="grid content-start items-start gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label={t("quiz.list.aria")}>
      {quizzes.map((source) => (
        <QuizListItem
          key={source.quiz.id}
          source={source}
          onOpenDetails={onOpenDetails}
        />
      ))}
    </section>
  );
}
