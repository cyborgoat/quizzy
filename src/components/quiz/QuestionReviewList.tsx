import { CheckCircle, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { QuestionReviewIndexGrid } from "@/components/quiz/QuestionReviewIndexGrid";
import { ReviewQuestionDialog } from "@/components/quiz/ReviewQuestionDialog";
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

function ReviewQuestionRow({
  question,
  index,
  record,
  onOpen,
}: {
  question: QuizQuestion;
  index: number;
  record: AnswerRecord;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="flex w-full scroll-mt-4 items-start gap-2.5 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-left transition-colors hover:border-zinc-200 hover:bg-zinc-100"
        onClick={onOpen}
      >
        <span className="grid-center mt-0.5 size-5 shrink-0 rounded-md bg-zinc-200 text-xs font-semibold tabular-nums text-zinc-700">
          {index + 1}
        </span>
        {record.isCorrect ? (
          <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
        ) : (
          <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden />
        )}
        <p className="min-w-0 flex-1 text-sm leading-5 text-zinc-800 line-clamp-3">
          {question.prompt}
        </p>
      </button>
    </li>
  );
}

export function QuestionReviewList({
  items,
  resetKey,
  listClassName,
}: {
  items: QuestionReviewItem[];
  resetKey?: string;
  listClassName?: string;
}) {
  return (
    <QuestionReviewListBody
      key={resetKey ?? String(items.length)}
      items={items}
      listClassName={listClassName}
    />
  );
}

function QuestionReviewListBody({
  items,
  listClassName,
}: {
  items: QuestionReviewItem[];
  listClassName?: string;
}) {
  const incorrectCount = items.filter((item) => !item.record.isCorrect).length;
  const correctCount = items.length - incorrectCount;

  const [filter, setFilter] = useState<ReviewFilter>(
    incorrectCount > 0 ? "incorrect" : "all",
  );
  const [dialogIndex, setDialogIndex] = useState<number | null>(null);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesFilter(item.record, filter)),
    [items, filter],
  );

  const dialogItem = dialogIndex === null ? null : items[dialogIndex];

  const filters: { value: ReviewFilter; label: string; count: number }[] = [
    { value: "incorrect", label: "Incorrect", count: incorrectCount },
    { value: "correct", label: "Correct", count: correctCount },
    { value: "all", label: "All", count: items.length },
  ];

  return (
    <>
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

        <QuestionReviewIndexGrid
          items={items.map((item) => ({
            id: item.question.id,
            isCorrect: item.record.isCorrect,
          }))}
          onSelect={setDialogIndex}
        />

        <ul className={listClassName ?? "space-y-2"} aria-label="Question results">
          {filteredItems.length === 0 ? (
            <li className="rounded-md border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
              {filter === "incorrect"
                ? "Perfect score — no incorrect answers."
                : "No questions to show."}
            </li>
          ) : (
            filteredItems.map((item) => (
              <ReviewQuestionRow
                key={item.question.id}
                question={item.question}
                index={item.index}
                record={item.record}
                onOpen={() => setDialogIndex(item.index)}
              />
            ))
          )}
        </ul>
      </div>

      {dialogItem && (
        <ReviewQuestionDialog
          open={dialogIndex !== null}
          question={dialogItem.question}
          index={dialogItem.index}
          record={dialogItem.record}
          onClose={() => setDialogIndex(null)}
        />
      )}
    </>
  );
}
