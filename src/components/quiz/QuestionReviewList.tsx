import { useMemo, useState } from "react";
import { QuestionReviewIndexGrid } from "@/components/quiz/QuestionReviewIndexGrid";
import { ReviewQuestionDetail } from "@/components/quiz/ReviewQuestionDetail";
import { Button } from "@/components/ui/button";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

type ReviewFilter = "incorrect" | "correct" | "all";

export type QuestionReviewItem = {
  question: QuizQuestion;
  index: number;
  record: AnswerRecord;
};

function matchesFilter(record: AnswerRecord, filter: ReviewFilter) {
  if (filter === "correct") return record.isCorrect;
  if (filter === "incorrect") return !record.isCorrect;
  return true;
}

function scrollToReviewQuestion(index: number) {
  document.getElementById(`review-question-${index}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function QuestionReviewList({
  items,
  resetKey,
  listClassName,
  showIndexGrid = true,
}: {
  items: QuestionReviewItem[];
  resetKey?: string;
  listClassName?: string;
  showIndexGrid?: boolean;
}) {
  return (
    <QuestionReviewListBody
      key={resetKey ?? String(items.length)}
      items={items}
      listClassName={listClassName}
      showIndexGrid={showIndexGrid}
    />
  );
}

function QuestionReviewListBody({
  items,
  listClassName,
  showIndexGrid,
}: {
  items: QuestionReviewItem[];
  listClassName?: string;
  showIndexGrid: boolean;
}) {
  const incorrectCount = items.filter((item) => !item.record.isCorrect).length;
  const correctCount = items.length - incorrectCount;

  const [filter, setFilter] = useState<ReviewFilter>(
    incorrectCount > 0 ? "incorrect" : "all",
  );

  const filteredItems = useMemo(
    () => items.filter((item) => matchesFilter(item.record, filter)),
    [items, filter],
  );

  const filters: { value: ReviewFilter; label: string; count: number }[] = [
    { value: "incorrect", label: "Incorrect", count: incorrectCount },
    { value: "correct", label: "Correct", count: correctCount },
    { value: "all", label: "All", count: items.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter questions">
        {filters.map(({ value, label, count }) => (
          <Button
            key={value}
            role="tab"
            aria-selected={filter === value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {label} ({count})
          </Button>
        ))}
      </div>

      {showIndexGrid && (
        <QuestionReviewIndexGrid
          items={items.map((item) => ({
            id: item.question.id,
            isCorrect: item.record.isCorrect,
          }))}
          onSelect={scrollToReviewQuestion}
        />
      )}

      {filteredItems.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
          {filter === "incorrect"
            ? "Perfect score — no incorrect answers."
            : "No questions to show."}
        </p>
      ) : (
        <div className={listClassName ?? "space-y-4"} aria-label="Question results">
          {filteredItems.map((item) => (
            <ReviewQuestionDetail
              key={item.question.id}
              question={item.question}
              index={item.index}
              record={item.record}
            />
          ))}
        </div>
      )}
    </div>
  );
}
