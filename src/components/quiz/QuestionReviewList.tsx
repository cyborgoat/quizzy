import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo } from "react";
import { ReviewQuestionSplitPanel } from "@/components/quiz/ReviewQuestionSplitPanel";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { Button } from "@/components/ui/button";
import { matchesReviewFilter, type ReviewFilter } from "@/lib/quizReview";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

export type QuestionReviewItem = {
  question: QuizQuestion;
  index: number;
  record: AnswerRecord;
};

function emptyFilterMessage(filter: ReviewFilter) {
  if (filter === "incorrect") return "Perfect score — no incorrect answers.";
  if (filter === "flagged") return "No flagged questions in this attempt.";
  return "No questions to show.";
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
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

  const incorrectCount = items.filter((item) => !item.record.isCorrect).length;
  const correctCount = items.length - incorrectCount;
  const flaggedCount = items.filter((item) => item.record.flagged).length;

  const currentFilteredPosition = filteredItems.findIndex(
    (item) => item.index === activeQuestionIndex,
  );
  const resolvedFilteredPosition = currentFilteredPosition >= 0 ? currentFilteredPosition : 0;
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

      const position = filteredItems.findIndex((item) => item.index === activeQuestionIndex);
      const resolved = position >= 0 ? position : 0;

      if (event.key === "ArrowLeft" && resolved > 0) {
        onActiveQuestionIndexChange(filteredItems[resolved - 1].index);
      }
      if (event.key === "ArrowRight" && resolved < filteredItems.length - 1) {
        onActiveQuestionIndexChange(filteredItems[resolved + 1].index);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, activeQuestionIndex, onActiveQuestionIndexChange]);

  const filters: { value: ReviewFilter; label: string; count: number }[] = [
    { value: "incorrect", label: "Incorrect", count: incorrectCount },
    { value: "correct", label: "Correct", count: correctCount },
    { value: "flagged", label: "Flagged", count: flaggedCount },
    { value: "all", label: "All", count: items.length },
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
        <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
          {emptyFilterMessage(filter)}
        </p>
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
