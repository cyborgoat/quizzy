import { useMemo } from "react";
import { InlineEmptyMessage } from "@/components/quiz/InlineEmptyMessage";
import { ReviewQuestionNavigationBar } from "@/components/quiz/ReviewQuestionNavigationBar";
import { ReviewQuestionSplitPanel } from "@/components/quiz/ReviewQuestionSplitPanel";
import { Button } from "@/components/ui/button";
import {
  getFilteredPosition,
  getReviewFilterCounts,
  matchesReviewFilter,
  type ReviewFilter,
} from "@/lib/quizReview";
import type { QuestionReviewItem } from "@/types/review";

function emptyFilterMessage(filter: ReviewFilter) {
  if (filter === "incorrect") return "Perfect score — no incorrect answers.";
  if (filter === "flagged") return "No flagged questions in this attempt.";
  return "No questions to show.";
}

export function QuestionReviewList({
  items,
  quizId,
  filter,
  onFilterChange,
  activeQuestionIndex,
  onActiveQuestionIndexChange,
}: {
  items: QuestionReviewItem[];
  quizId?: string;
  filter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  activeQuestionIndex: number;
  onActiveQuestionIndexChange: (index: number) => void;
}) {
  const filteredItems = useMemo(
    () => items.filter((item) => matchesReviewFilter(item.record, filter)),
    [items, filter],
  );

  const filterCounts = useMemo(() => getReviewFilterCounts(items), [items]);

  const resolvedFilteredPosition = useMemo(
    () => getFilteredPosition(filteredItems, activeQuestionIndex),
    [filteredItems, activeQuestionIndex],
  );
  const currentItem = filteredItems[resolvedFilteredPosition];

  function goToPreviousQuestion() {
    if (resolvedFilteredPosition === 0) return;
    onActiveQuestionIndexChange(filteredItems[resolvedFilteredPosition - 1].index);
  }

  function goToNextQuestion() {
    if (resolvedFilteredPosition >= filteredItems.length - 1) return;
    onActiveQuestionIndexChange(filteredItems[resolvedFilteredPosition + 1].index);
  }

  const filters: { value: ReviewFilter; label: string; count: number }[] = [
    { value: "incorrect", label: "Incorrect", count: filterCounts.incorrect },
    { value: "correct", label: "Correct", count: filterCounts.correct },
    { value: "flagged", label: "Flagged", count: filterCounts.flagged },
    { value: "all", label: "All", count: filterCounts.all },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter questions">
        {filters.map(({ value, label, count }) => (
          <Button
            key={value}
            role="tab"
            aria-selected={filter === value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => onFilterChange(value)}
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <InlineEmptyMessage>{emptyFilterMessage(filter)}</InlineEmptyMessage>
      ) : (
        <div className="space-y-3" aria-label="Question results">
          <ReviewQuestionNavigationBar
            position={resolvedFilteredPosition + 1}
            total={filteredItems.length}
            onPrevious={goToPreviousQuestion}
            onNext={goToNextQuestion}
            disablePrevious={resolvedFilteredPosition === 0}
            disableNext={resolvedFilteredPosition >= filteredItems.length - 1}
          />
          {currentItem && (
            <ReviewQuestionSplitPanel
              question={currentItem.question}
              index={currentItem.index}
              record={currentItem.record}
              quizId={quizId}
            />
          )}
        </div>
      )}
    </div>
  );
}
