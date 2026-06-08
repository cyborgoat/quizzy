import { cn } from "@/lib/utils";
import { QuestionReviewIndexGrid } from "@/components/quiz/QuestionReviewIndexGrid";
import type { Goal, GoalAttempt } from "@/types/goal";

function scrollToReviewQuestion(index: number) {
  document.getElementById(`review-question-${index}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

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

function attemptMetrics(attempt: GoalAttempt) {
  const unansweredCount = attempt.questionResults.filter((result) => !result.answer).length;
  const incorrectCount = attempt.incorrectCount;

  return {
    unansweredCount,
    incorrectCount,
  };
}

export function AttemptScoreSummary({
  attempt,
  goal,
}: {
  attempt: GoalAttempt;
  goal: Goal;
}) {
  const { unansweredCount, incorrectCount } = attemptMetrics(attempt);
  const date = new Date(attempt.takenAt).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const metTarget =
    goal.targetScore === undefined || attempt.percentage >= goal.targetScore;

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <p className="text-sm text-zinc-600">
          {date}
        </p>
        {goal.targetScore !== undefined && (
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium",
              metTarget
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-red-300 bg-red-50 text-red-600",
            )}
          >
            {metTarget ? "Target met" : "Below target"} · {goal.targetScore}%
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-zinc-200 bg-zinc-200 sm:grid-cols-4">
        <ResultMetric label="Score" value={`${attempt.percentage}%`} prominent />
        <ResultMetric label="Correct" value={`${attempt.score}/${attempt.total}`} />
        <ResultMetric label="Incorrect" value={String(incorrectCount)} />
        <ResultMetric label="Unanswered" value={String(unansweredCount)} />
      </div>

      {attempt.questionResults.length > 0 && (
        <div className="border-t border-zinc-200 px-5 py-4">
          <QuestionReviewIndexGrid
            items={attempt.questionResults.map((result, index) => ({
              id: `${result.questionId}-${index}`,
              isCorrect: result.correct,
            }))}
            onSelect={scrollToReviewQuestion}
          />
        </div>
      )}
    </section>
  );
}
