import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionReviewList } from "@/components/quiz/QuestionReviewList";
import { useAttemptReviewItems } from "@/lib/attemptReview";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import type { GoalAttempt } from "@/types/goal";

export function AttemptReviewPanel({
  attempt,
  quizId,
  quizTitle,
  loading = false,
  error = null,
  onClose,
}: {
  attempt: GoalAttempt | null;
  quizId: string;
  quizTitle: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}) {
  const { quizzes } = useQuizLibrary();
  const quiz = quizzes.find((source) => source.quiz.id === quizId)?.quiz;
  const items = useAttemptReviewItems(attempt ?? undefined, quiz?.questions);

  const date = attempt
    ? new Date(attempt.takenAt).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <aside
      className="sticky top-0 flex h-svh w-full max-w-md shrink-0 flex-col border-l border-zinc-200 bg-white"
      aria-label="Attempt review"
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold text-zinc-950">Attempt review</h2>
          <p className="truncate text-sm font-medium text-zinc-700">{quizTitle}</p>
          <p className="text-sm text-zinc-500">{date}</p>
          <p className="text-sm font-semibold text-zinc-900">
            {attempt
              ? `${attempt.score}/${attempt.total} · ${attempt.percentage}%`
              : "—"}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 text-zinc-500"
          onClick={onClose}
          aria-label="Close review panel"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            Loading attempt…
          </p>
        ) : error ? (
          <p className="rounded-md border border-dashed border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
            {error}
          </p>
        ) : !attempt ? (
          <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            Attempt details are unavailable.
          </p>
        ) : !quiz ? (
          <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            This quiz is unavailable, so question details cannot be shown.
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            No matching questions found for this attempt.
          </p>
        ) : (
          <QuestionReviewList
            items={items}
            resetKey={attempt.id}
            listClassName="space-y-2"
          />
        )}
      </div>
    </aside>
  );
}
