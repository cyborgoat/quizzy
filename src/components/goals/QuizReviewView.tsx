import { useMemo } from "react";
import { AttemptHistoryCard } from "@/components/goals/AttemptHistoryPanel";
import { ReviewHeader } from "@/components/goals/ReviewHeader";
import { ReviewScoreSummary } from "@/components/goals/ReviewScoreSummary";
import { InlineEmptyMessage } from "@/components/quiz/InlineEmptyMessage";
import { QuestionReviewCard } from "@/components/quiz/QuestionReviewCard";
import { Button } from "@/components/ui/button";
import { sectionLabelClassName } from "@/components/ui/section-label";
import { useAttemptReviewNavigation } from "@/hooks/useAttemptReviewNavigation";
import { cn } from "@/lib/utils";
import {
  getFilteredPosition,
  getReviewFilterCounts,
  matchesReviewFilter,
  type ReviewFilter,
} from "@/lib/quizReview";
import type {
  ReviewGoalContext,
  ReviewPracticeContext,
  ReviewScoreSummaryData,
} from "@/lib/quizReviewSummary";
import type { QuestionReviewItem } from "@/types/review";

function emptyFilterMessage(filter: ReviewFilter) {
  if (filter === "incorrect") return "Perfect score — no incorrect answers.";
  if (filter === "flagged") return "No flagged questions in this attempt.";
  return "No questions to show.";
}

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

  const filteredItems = useMemo(
    () => items.filter((item) => matchesReviewFilter(item.record, navigation.filter)),
    [items, navigation.filter],
  );

  const filterCounts = useMemo(() => getReviewFilterCounts(items), [items]);

  const resolvedFilteredPosition = useMemo(
    () => getFilteredPosition(filteredItems, navigation.activeQuestionIndex),
    [filteredItems, navigation.activeQuestionIndex],
  );
  const currentItem = filteredItems[resolvedFilteredPosition];

  function goToPreviousQuestion() {
    if (resolvedFilteredPosition === 0) return;
    navigation.onActiveQuestionIndexChange(
      filteredItems[resolvedFilteredPosition - 1].index,
    );
  }

  function goToNextQuestion() {
    if (resolvedFilteredPosition >= filteredItems.length - 1) return;
    navigation.onActiveQuestionIndexChange(
      filteredItems[resolvedFilteredPosition + 1].index,
    );
  }

  const filters: { value: ReviewFilter; label: string; count: number }[] = [
    { value: "incorrect", label: "Incorrect", count: filterCounts.incorrect },
    { value: "correct", label: "Correct", count: filterCounts.correct },
    { value: "flagged", label: "Flagged", count: filterCounts.flagged },
    { value: "all", label: "All", count: filterCounts.all },
  ];

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
        <h2 className={cn("mb-3", sectionLabelClassName)}>
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
          <div key={resetKey} className="space-y-3">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter questions">
              {filters.map(({ value, label, count }) => (
                <Button
                  key={value}
                  role="tab"
                  aria-selected={navigation.filter === value}
                  size="sm"
                  variant={navigation.filter === value ? "default" : "outline"}
                  onClick={() => navigation.onFilterChange(value)}
                >
                  {label} ({count})
                </Button>
              ))}
            </div>

            {filteredItems.length === 0 ? (
              <InlineEmptyMessage>{emptyFilterMessage(navigation.filter)}</InlineEmptyMessage>
            ) : (
              currentItem && (
                <QuestionReviewCard
                  question={currentItem.question}
                  questionIndex={currentItem.index}
                  record={currentItem.record}
                  quizId={quizId}
                  position={resolvedFilteredPosition + 1}
                  total={filteredItems.length}
                  onPrevious={goToPreviousQuestion}
                  onNext={goToNextQuestion}
                  disablePrevious={resolvedFilteredPosition === 0}
                  disableNext={resolvedFilteredPosition >= filteredItems.length - 1}
                  panelKey={`${currentItem.question.id}:${currentItem.index}`}
                />
              )
            )}
          </div>
        )}
      </section>
    </>
  );
}
