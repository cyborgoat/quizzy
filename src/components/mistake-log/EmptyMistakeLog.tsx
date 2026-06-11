import { Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/quiz/EmptyState";
import type { MistakeLogThresholds } from "@/types/mistakeLog";

export function EmptyMistakeLog({
  reason,
  thresholds,
  scopedQuizTitle,
}: {
  reason: "no_attempts" | "no_mistakes" | "thresholds_exclude_all";
  thresholds: MistakeLogThresholds;
  scopedQuizTitle?: string;
}) {
  const scopePrefix = scopedQuizTitle ? `${scopedQuizTitle}: ` : "";

  if (reason === "no_attempts") {
    return (
      <EmptyState
        title={`${scopePrefix}No mistakes recorded yet`}
        description="Complete a scored quiz to build your Mistake Log."
      />
    );
  }

  if (reason === "no_mistakes") {
    return (
      <EmptyState
        title={`${scopePrefix}No mistakes or flags found`}
        description="No mistakes or flagged questions found in your scored attempts."
      />
    );
  }

  return (
    <section className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
      <h2 className="text-xl font-semibold text-zinc-950">
        {scopePrefix}No mistakes meet your current thresholds
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">
        Showing questions with at least {thresholds.minMistakes} mistake(s) and correctness at or
        below {thresholds.maxCorrectnessPercentage}%, or with at least {thresholds.minFlags} flag(s).
      </p>
      <Link
        to="/settings"
        className="mt-6 inline-flex h-8 items-center justify-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Settings
      </Link>
    </section>
  );
}
