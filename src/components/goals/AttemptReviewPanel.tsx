import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { QuestionReviewList } from "@/components/quiz/QuestionReviewList";
import { useAttemptReviewItems } from "@/lib/attemptReview";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { errorMessage } from "@/lib/native";
import type { GoalAttempt } from "@/types/goal";

function AttemptReviewBody({
  attempt,
  quizId,
  quizTitle,
  loading = false,
  error = null,
}: {
  attempt: GoalAttempt | null;
  quizId: string;
  quizTitle: string;
  loading?: boolean;
  error?: string | null;
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
    <>
      <DrawerHeader className="shrink-0 border-b border-zinc-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="min-w-0 space-y-1">
            <DrawerTitle>Attempt review</DrawerTitle>
            <DrawerDescription className="truncate font-medium text-zinc-700">
              {quizTitle}
            </DrawerDescription>
            {date && <DrawerDescription>{date}</DrawerDescription>}
            <p className="text-sm font-semibold text-zinc-900">
              {attempt
                ? `${attempt.score}/${attempt.total} · ${attempt.percentage}%`
                : "—"}
            </p>
          </div>
        </div>
      </DrawerHeader>

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
    </>
  );
}

export function AttemptReviewDrawer({
  open,
  onOpenChange,
  goalId,
  attemptId,
  quizId,
  quizTitle,
  loadGoalAttempt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  attemptId: string;
  quizId: string;
  quizTitle: string;
  loadGoalAttempt: (goalId: string, attemptId: string) => Promise<GoalAttempt>;
}) {
  const [attempt, setAttempt] = useState<GoalAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    void loadGoalAttempt(goalId, attemptId)
      .then((loaded) => {
        if (!cancelled) setAttempt(loaded);
      })
      .catch((loadError) => {
        if (!cancelled) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, goalId, attemptId, loadGoalAttempt]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="flex h-full flex-col p-0">
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-3 top-3 z-10 size-8 shrink-0 text-zinc-500"
          onClick={() => onOpenChange(false)}
          aria-label="Close review drawer"
        >
          <X className="size-4" />
        </Button>
        <AttemptReviewBody
          attempt={attempt}
          quizId={quizId}
          quizTitle={quizTitle}
          loading={loading}
          error={error}
        />
      </DrawerContent>
    </Drawer>
  );
}
