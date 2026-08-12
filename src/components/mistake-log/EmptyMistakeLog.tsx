import { Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/quiz/EmptyState";
import { buttonClassName } from "@/components/ui/button-styles";
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
    <EmptyState
      title={`${scopePrefix}No mistakes meet your current thresholds`}
      description={`Showing questions with at least ${thresholds.minMistakes} mistake(s) and correctness at or below ${thresholds.maxCorrectnessPercentage}%, or with at least ${thresholds.minFlags} flag(s).`}
      action={
        <Link to="/settings" className={buttonClassName({ className: "mt-6" })}>
          Settings
        </Link>
      }
    />
  );
}
