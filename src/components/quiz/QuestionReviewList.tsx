import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo } from "react";
import { InlineEmptyMessage } from "@/components/quiz/InlineEmptyMessage";
import { ReviewQuestionSplitPanel } from "@/components/quiz/ReviewQuestionSplitPanel";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Button } from "@/components/ui/button";
import { isEditableKeyboardTarget } from "@/lib/keyboard";
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
  resetKey,
  filter,
  onFilterChange,
  activeQuestionIndex,
  onActiveQuestionIndexChange,
}: {
  items: QuestionReviewItem[];
  quizId?: string;
  resetKey?: string;
  filter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  activeQuestionIndex: number;
  onActiveQuestionIndexChange: (index: number) => void;
}) {
  return (
    <QuestionReviewListBody
      key={resetKey ?? String(items.length)}
      items={items}
      quizId={quizId}
      filter={filter}
      onFilterChange={onFilterChange}
      activeQuestionIndex={activeQuestionIndex}
      onActiveQuestionIndexChange={onActiveQuestionIndexChange}
    />
  );
}

function QuestionReviewListBody({
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (isEditableKeyboardTarget(event.target)) return;
      if (filteredItems.length === 0) return;

      event.preventDefault();

      if (event.key === "ArrowLeft" && resolvedFilteredPosition > 0) {
        onActiveQuestionIndexChange(filteredItems[resolvedFilteredPosition - 1].index);
      }
      if (event.key === "ArrowRight" && resolvedFilteredPosition < filteredItems.length - 1) {
        onActiveQuestionIndexChange(filteredItems[resolvedFilteredPosition + 1].index);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, resolvedFilteredPosition, onActiveQuestionIndexChange]);

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
          <div className="flex items-center justify-center gap-2">
            <IconActionButton
              icon={ChevronLeft}
              label="Previous question"
              onClick={goToPreviousQuestion}
              disabled={resolvedFilteredPosition === 0}
            />
            <p className="min-w-14 text-center text-xs tabular-nums text-zinc-500">
              {resolvedFilteredPosition + 1} / {filteredItems.length}
            </p>
            <IconActionButton
              icon={ChevronRight}
              label="Next question"
              onClick={goToNextQuestion}
              disabled={resolvedFilteredPosition === filteredItems.length - 1}
            />
          </div>
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
