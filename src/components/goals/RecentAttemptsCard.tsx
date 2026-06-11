import { History } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/lib/formatDate";
import {
  RECENT_ATTEMPTS_INITIAL_COUNT,
  RECENT_ATTEMPTS_LOAD_MORE_COUNT,
  type RecentAttemptEntry,
} from "@/lib/recentAttempts";

const LIST_MAX_HEIGHT_CLASS = "max-h-80";

export function RecentAttemptsCard({
  attempts,
  onSelectGoal,
}: {
  attempts: RecentAttemptEntry[];
  onSelectGoal?: (goalId: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(RECENT_ATTEMPTS_INITIAL_COUNT);

  if (attempts.length === 0) {
    return null;
  }

  const visibleAttempts = attempts.slice(0, visibleCount);
  const hasMore = visibleCount < attempts.length;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 lg:p-5">
      <div>
        <div className="flex items-center gap-2">
          <History className="size-4 shrink-0 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-950">Recent attempts</h2>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Jump back into your latest scored quizzes without digging through each goal.
        </p>
      </div>

      <div className={`mt-4 overflow-y-auto ${LIST_MAX_HEIGHT_CLASS}`}>
        <ul className="space-y-2">
          {visibleAttempts.map((entry) => (
            <li
              key={`${entry.goalId}:${entry.attemptId}`}
              className="flex flex-col gap-3 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {onSelectGoal ? (
                    <button
                      type="button"
                      className="truncate text-left text-sm font-semibold text-zinc-950 hover:underline"
                      onClick={() => onSelectGoal(entry.goalId)}
                    >
                      {entry.quizTitle}
                    </button>
                  ) : (
                    <p className="truncate text-sm font-semibold text-zinc-950">{entry.quizTitle}</p>
                  )}
                  {entry.goalCompleted && (
                    <Badge className="whitespace-nowrap text-[10px] uppercase tracking-wide">
                      Complete
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">{formatShortDate(entry.takenAt)}</p>
                <p className="mt-1 text-xs font-medium text-zinc-700">
                  {entry.score}/{entry.total} · {entry.percentage}%
                  {entry.incorrectCount > 0 && (
                    <span className="text-red-600">{` · ${entry.incorrectCount} incorrect`}</span>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                <Link
                  to="/goals/$goalId/attempts/$attemptId"
                  params={{ goalId: entry.goalId, attemptId: entry.attemptId }}
                  className="inline-flex h-7 items-center justify-center rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
                >
                  Review
                </Link>
                <Link
                  to="/quiz/$quizId"
                  params={{ quizId: entry.quizId }}
                  search={{ from: "goals" }}
                  className="inline-flex h-7 items-center justify-center rounded-md bg-zinc-900 px-2.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  Retake
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {hasMore && (
        <div className="border-t border-zinc-100 pt-3">
          <button
            type="button"
            className="text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-950"
            onClick={() =>
              setVisibleCount((count) =>
                Math.min(count + RECENT_ATTEMPTS_LOAD_MORE_COUNT, attempts.length),
              )
            }
          >
            Load more
          </button>
        </div>
      )}
    </section>
  );
}
