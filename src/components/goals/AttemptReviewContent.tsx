import { QuestionReviewList } from "@/components/quiz/QuestionReviewList";
import { useAttemptReviewItems } from "@/lib/attemptReview";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import type { GoalAttempt } from "@/types/goal";

export function AttemptReviewContent({
  attempt,
  quizId,
  loading = false,
  error = null,
}: {
  attempt: GoalAttempt | null;
  quizId: string;
  loading?: boolean;
  error?: string | null;
}) {
  const { quizzes } = useQuizLibrary();
  const quiz = quizzes.find((source) => source.quiz.id === quizId)?.quiz;
  const items = useAttemptReviewItems(attempt ?? undefined, quiz?.questions);

  if (loading) {
    return (
      <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
        Loading attempt…
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-md border border-dashed border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (!attempt) {
    return (
      <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
        Attempt details are unavailable.
      </p>
    );
  }

  if (!quiz) {
    return (
      <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
        This quiz is unavailable, so question details cannot be shown.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
        No matching questions found for this attempt.
      </p>
    );
  }

  return (
    <QuestionReviewList
      items={items}
      resetKey={attempt.id}
      listClassName="space-y-2"
      showIndexGrid={false}
    />
  );
}
