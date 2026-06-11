import { QuizReviewView } from "@/components/goals/QuizReviewView";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useAttemptReviewItems } from "@/hooks/useAttemptReviewItems";
import { reviewScoreFromAttempt } from "@/lib/quizReviewSummary";
import type { Goal, GoalAttempt } from "@/types/goal";

export function AttemptReviewView({
  goal,
  attempt,
  attemptId,
}: {
  goal: Goal;
  attempt: GoalAttempt;
  attemptId: string;
}) {
  const { quizzes } = useQuizLibrary();
  const quiz = quizzes.find((source) => source.quiz.id === goal.quizId)?.quiz;
  const items = useAttemptReviewItems(attempt, quiz?.questions);
  const hasMultipleAttempts = goal.attempts.length > 1;

  return (
    <QuizReviewView
      quizId={goal.quizId}
      quizTitle={goal.quizTitle}
      items={items}
      resetKey={attempt.id}
      score={reviewScoreFromAttempt(attempt)}
      goalContext={{
        goal,
        attemptTakenAt: attempt.takenAt,
        targetScore: goal.targetScore,
        attemptHistory: hasMultipleAttempts
          ? {
              goalId: goal.id,
              attempts: goal.attempts,
              currentAttemptId: attemptId,
            }
          : undefined,
      }}
      practiceContext={null}
      quizAvailable={Boolean(quiz)}
    />
  );
}
