import { useMemo } from "react";
import { buildAttemptReviewItems } from "@/lib/attemptReview";
import type { GoalAttempt } from "@/types/goal";
import type { QuizQuestion } from "@/types/quiz";

export function useAttemptReviewItems(
  attempt: GoalAttempt | undefined,
  questions: QuizQuestion[] | undefined,
) {
  return useMemo(
    () => (attempt && questions ? buildAttemptReviewItems(attempt, questions) : []),
    [attempt, questions],
  );
}
