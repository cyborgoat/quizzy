import { cn } from "@/lib/utils";
import { QuestionReviewIndexGrid } from "@/components/quiz/QuestionReviewIndexGrid";
import type { ReviewGoalContext, ReviewScoreSummaryData } from "@/lib/quizReviewSummary";

function ResultMetric({
  label,
  value,
  prominent = false,
}: {
  label: string;
  value: string;
  prominent?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-semibold text-zinc-950",
          prominent ? "text-xl" : "text-base",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function ReviewScoreSummary({
  score,
  goalContext,
  selectedQuestionIndex,
  onQuestionSelect,
}: {
  score: ReviewScoreSummaryData;
  goalContext: ReviewGoalContext | null;
  selectedQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
}) {
  const takenAt = goalContext?.attemptTakenAt;
  const targetScore = goalContext?.targetScore;
  const metTarget =
    targetScore === undefined || score.percentage >= targetScore;

  const formattedDate = takenAt
    ? new Date(takenAt).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
      {goalContext && formattedDate && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <p className="text-sm text-zinc-600">{formattedDate}</p>
          {targetScore !== undefined && (
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                metTarget
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-red-300 bg-red-50 text-red-600",
              )}
            >
              {metTarget ? "Target met" : "Below target"} · {targetScore}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          "grid grid-cols-2 gap-px bg-zinc-200 sm:grid-cols-4",
          goalContext ? "border-t border-zinc-200" : "",
        )}
      >
        <ResultMetric label="Score" value={`${score.percentage}%`} prominent />
        <ResultMetric label="Correct" value={`${score.score}/${score.total}`} />
        <ResultMetric label="Incorrect" value={String(score.incorrectCount)} />
        <ResultMetric label="Unanswered" value={String(score.unansweredCount)} />
      </div>

      {score.indexItems.length > 0 && (
        <div className="border-t border-zinc-200 px-5 py-4">
          <QuestionReviewIndexGrid
            items={score.indexItems}
            selectedIndex={selectedQuestionIndex}
            onSelect={onQuestionSelect}
          />
        </div>
      )}
    </section>
  );
}
