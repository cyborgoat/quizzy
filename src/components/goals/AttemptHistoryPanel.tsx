import { Link, useNavigate } from "@tanstack/react-router";
import { formatShortDate } from "@/lib/formatDate";
import { cn } from "@/lib/utils";
import type { AttemptSummary } from "@/types/goal";

function AttemptHistoryList({
  goalId,
  attempts,
  currentAttemptId,
}: {
  goalId: string;
  attempts: AttemptSummary[];
  currentAttemptId: string;
}) {
  return (
    <ul className="space-y-1" aria-label="Attempt history">
      {attempts.map((attempt) => {
        const isCurrent = attempt.id === currentAttemptId;

        return (
          <li key={attempt.id}>
            <Link
              to="/goals/$goalId/attempts/$attemptId"
              params={{ goalId, attemptId: attempt.id }}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                isCurrent
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-zinc-300 hover:bg-zinc-100",
              )}
              aria-current={isCurrent ? "page" : undefined}
            >
              <span className={cn("text-xs", isCurrent ? "text-zinc-300" : "text-zinc-500")}>
                {formatShortDate(attempt.takenAt)}
              </span>
              <span className="font-semibold tabular-nums">{attempt.percentage}%</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AttemptHistoryCard({
  goalId,
  attempts,
  currentAttemptId,
}: {
  goalId: string;
  attempts: AttemptSummary[];
  currentAttemptId: string;
}) {
  const navigate = useNavigate();
  const sortedAttempts = [...attempts].reverse();

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Attempt history
        </h2>
      </div>

      <div className="flex-1 p-4">
        <div className="lg:hidden">
          <select
            id="attempt-select"
            value={currentAttemptId}
            onChange={(event) => {
              const nextId = event.target.value;
              if (nextId !== currentAttemptId) {
                navigate({
                  to: "/goals/$goalId/attempts/$attemptId",
                  params: { goalId, attemptId: nextId },
                });
              }
            }}
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            aria-label="Select attempt"
          >
            {sortedAttempts.map((attempt) => (
              <option key={attempt.id} value={attempt.id}>
                {formatShortDate(attempt.takenAt)} · {attempt.percentage}%
              </option>
            ))}
          </select>
        </div>

        <div className="hidden lg:block">
          <AttemptHistoryList
            goalId={goalId}
            attempts={sortedAttempts}
            currentAttemptId={currentAttemptId}
          />
        </div>
      </div>
    </section>
  );
}
