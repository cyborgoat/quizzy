import { useMemo, type ReactNode } from "react";
import { AttemptHistoryCard } from "@/components/goals/AttemptHistoryPanel";
import { ReviewHeader } from "@/components/goals/ReviewHeader";
import { ReviewScoreSummary } from "@/components/goals/ReviewScoreSummary";
import { InlineEmptyMessage } from "@/components/quiz/InlineEmptyMessage";
import { QuestionReviewCard } from "@/components/quiz/QuestionReviewCard";
import { Button } from "@/components/ui/button";
import { toggleOutlineButtonClass } from "@/lib/toggleOutlineButtonClass";
import { sectionLabelClassName } from "@/components/ui/section-label";
import { useAttemptReviewNavigation } from "@/hooks/useAttemptReviewNavigation";
import { cn } from "@/lib/utils";
import {
  getFilteredPosition,
  getReviewFilterCounts,
  isShowingAllReviewFilters,
  matchesReviewFilter,
  type ReviewFilterKind,
  type ReviewFilters,
} from "@/lib/quizReview";
import type {
  ReviewGoalContext,
  ReviewScoreSummaryData,
} from "@/lib/quizReviewSummary";
import type { QuestionReviewItem } from "@/types/review";
import { useI18n } from "@/lib/i18n";
import type { TFunction } from "@/lib/i18n";

function emptyFilterMessage(filters: ReviewFilters, t: TFunction) {
  if (filters.size === 0) {
    return t("review.empty.noFilters");
  }
  if (filters.size === 1) {
    const [kind] = filters;
    if (kind === "incorrect") return t("review.empty.perfect");
    if (kind === "flagged") return t("review.empty.noFlagged");
    if (kind === "correct") return t("review.empty.noCorrect");
  }
  return t("review.empty.noMatch");
}

export function QuizReviewView({
  quizId,
  quizTitle,
  items,
  resetKey,
  score,
  goalContext,
  quizAvailable = true,
  notification,
}: {
  quizId: string;
  quizTitle: string;
  items: QuestionReviewItem[];
  resetKey: string;
  score: ReviewScoreSummaryData;
  goalContext: ReviewGoalContext | null;
  quizAvailable?: boolean;
  notification?: ReactNode;
}) {
  const { t } = useI18n();

  const navigation = useAttemptReviewNavigation(items);
  const attemptHistory = goalContext?.attemptHistory;
  const hasAttemptHistory = Boolean(attemptHistory);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesReviewFilter(item.record, navigation.filters)),
    [items, navigation.filters],
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

  const filters: { value: ReviewFilterKind | "all"; label: string; count: number }[] = [
    { value: "incorrect", label: t("review.filter.incorrect"), count: filterCounts.incorrect },
    { value: "correct", label: t("review.filter.correct"), count: filterCounts.correct },
    { value: "flagged", label: t("review.filter.flagged"), count: filterCounts.flagged },
    { value: "all", label: t("review.filter.all"), count: filterCounts.all },
  ];

  return (
    <>
      <ReviewHeader quizTitle={quizTitle} goalContext={goalContext} notification={notification} />

      <div
        className={
          hasAttemptHistory
            ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch"
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
            quizId={attemptHistory.quizId}
            attempts={attemptHistory.attempts}
            currentAttemptId={attemptHistory.currentAttemptId}
          />
        )}
      </div>

      <section>
        <h2 className={cn("mb-3", sectionLabelClassName)}>
          {t("review.answerReview")}
        </h2>
        {!quizAvailable ? (
          <InlineEmptyMessage>
            {t("review.quizUnavailable")}
          </InlineEmptyMessage>
        ) : items.length === 0 ? (
          <InlineEmptyMessage>
            {t("review.noMatchingQuestions")}
          </InlineEmptyMessage>
        ) : (
          <div key={resetKey} className="space-y-3">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("review.filterAria")}>
              {filters.map(({ value, label, count }) => {
                const isActive =
                  value === "all"
                    ? isShowingAllReviewFilters(navigation.filters)
                    : navigation.filters.has(value);
                return (
                  <Button
                    key={value}
                    aria-pressed={isActive}
                    size="sm"
                    variant="outline"
                    className={cn("rounded-full", toggleOutlineButtonClass(isActive))}
                    onClick={() => navigation.onFilterToggle(value)}
                  >
                    {label} ({count})
                  </Button>
                );
              })}
            </div>

            {filteredItems.length === 0 ? (
              <InlineEmptyMessage>{emptyFilterMessage(navigation.filters, t)}</InlineEmptyMessage>
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
                  flat
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
