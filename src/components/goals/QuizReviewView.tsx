import { AttemptHistoryCard } from "@/components/goals/AttemptHistoryPanel";
import { ReviewHeader } from "@/components/goals/ReviewHeader";
import { ReviewScoreSummary } from "@/components/goals/ReviewScoreSummary";
import { InlineEmptyMessage } from "@/components/quiz/InlineEmptyMessage";
import { QuestionReviewList } from "@/components/quiz/QuestionReviewList";
import type { QuestionReviewItem } from "@/types/review";
import { useAttemptReviewNavigation } from "@/hooks/useAttemptReviewNavigation";
import type {
  ReviewGoalContext,
  ReviewPracticeContext,
  ReviewScoreSummaryData,
} from "@/lib/quizReviewSummary";

export function QuizReviewView({
  quizId,
  quizTitle,
  items,
  resetKey,
  score,
  goalContext,
  practiceContext,
  quizAvailable = true,
}: {
  quizId: string;
  quizTitle: string;
  items: QuestionReviewItem[];
  resetKey: string;
  score: ReviewScoreSummaryData;
  goalContext: ReviewGoalContext | null;
  practiceContext: ReviewPracticeContext | null;
  quizAvailable?: boolean;
}) {
  const navigation = useAttemptReviewNavigation(items);
  const attemptHistory = goalContext?.attemptHistory;
  const hasAttemptHistory = Boolean(attemptHistory);

  return (
    <>
      <ReviewHeader
        quizTitle={quizTitle}
        goalContext={goalContext}
        practiceContext={practiceContext}
      />

      <div
        className={
          hasAttemptHistory
            ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch"
            : undefined
        }
      >
        <ReviewScoreSummary
          score={score}
          goalContext={goalContext}
          selectedQuestionIndex={navigation.activeQuestionIndex}
          onQuestionSelect={navigation.selectQuestion}
        />

        {attemptHistory && (
          <AttemptHistoryCard
            goalId={attemptHistory.goalId}
            attempts={attemptHistory.attempts}
            currentAttemptId={attemptHistory.currentAttemptId}
          />
        )}
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Answer review
        </h2>
        {!quizAvailable ? (
          <InlineEmptyMessage>
            This quiz is unavailable, so question details cannot be shown.
          </InlineEmptyMessage>
        ) : items.length === 0 ? (
          <InlineEmptyMessage>
            No matching questions found for this attempt.
          </InlineEmptyMessage>
        ) : (
          <QuestionReviewList
            items={items}
            quizId={quizId}
            resetKey={resetKey}
            filter={navigation.filter}
            onFilterChange={navigation.onFilterChange}
            activeQuestionIndex={navigation.activeQuestionIndex}
            onActiveQuestionIndexChange={navigation.onActiveQuestionIndexChange}
          />
        )}
      </section>
    </>
  );
}
