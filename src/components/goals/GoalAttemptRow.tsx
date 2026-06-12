import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { AttemptResultBadge } from "@/components/goals/AttemptResultBadge";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { formatShortDate } from "@/lib/formatDate";
import { attemptPassed, type AttemptSummary } from "@/types/goal";

export function GoalAttemptRow({
  goalId,
  quizTitle,
  targetScore,
  attempt,
  onDelete,
  deleteLabel,
  showQuizTitle = true,
}: {
  goalId: string;
  quizTitle?: string;
  targetScore?: number;
  attempt: AttemptSummary;
  onDelete?: (event: MouseEvent) => void;
  deleteLabel?: string;
  showQuizTitle?: boolean;
}) {
  const dateLabel = formatShortDate(attempt.takenAt);
  const passed = attemptPassed(attempt, targetScore);
  const scoreLabel = `${attempt.percentage}% (${attempt.score}/${attempt.total})`;

  return (
    <Link
      to="/goals/$goalId/attempts/$attemptId"
      params={{ goalId, attemptId: attempt.id }}
      className="group flex items-center gap-2 px-3 py-2 text-xs text-zinc-950 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
    >
      <p className="min-w-0 flex-1 truncate">
        {showQuizTitle && quizTitle ? (
          <>
            <span className="font-medium">{quizTitle}</span>
            <span className="text-zinc-500">
              {` · ${dateLabel} · ${scoreLabel}`}
            </span>
          </>
        ) : (
          <>
            <span className="font-medium">{dateLabel}</span>
            <span className="text-zinc-500">{` · ${scoreLabel}`}</span>
          </>
        )}
      </p>
      {onDelete && (
        <IconActionButton
          icon={Trash2}
          label={deleteLabel ?? `Delete attempt from ${dateLabel}`}
          showTooltip={false}
          className="size-7 shrink-0 pointer-events-none text-zinc-500 opacity-0 transition-opacity hover:text-red-700 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
          onClick={(event) => onDelete(event)}
        />
      )}
      <AttemptResultBadge passed={passed} className="shrink-0" />
    </Link>
  );
}
