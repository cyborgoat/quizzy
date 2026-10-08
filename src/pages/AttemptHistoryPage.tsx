import { confirm } from "@tauri-apps/plugin-dialog";
import { Link } from "@tanstack/react-router";
import { History, RotateCcw, Trash2 } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { AttemptResultBadge } from "@/components/goals/AttemptResultBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/quiz/EmptyState";
import { LoadingState } from "@/components/quiz/LoadingState";
import { Badge } from "@/components/ui/badge";
import { CardShine } from "@/components/ui/card-shine";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { SearchField } from "@/components/ui/search-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGoals } from "@/hooks/useGoals";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import {
  attemptHistoryStats,
  attemptLocalDateKey,
  collectAttemptHistory,
  filterAttemptHistory,
  type AttemptHistoryEntry,
  type AttemptHistorySort,
} from "@/lib/recentAttempts";
import { attemptPassed } from "@/types/goal";

const HISTORY_BATCH_SIZE = 20;

function formatAttemptDay(entry: AttemptHistoryEntry) {
  const key = attemptLocalDateKey(entry.attempt.takenAt);
  const now = new Date();
  const todayKey = attemptLocalDateKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = attemptLocalDateKey(yesterday.toISOString());

  if (key === todayKey) return "Today";
  if (key === yesterdayKey) return "Yesterday";
  return new Date(entry.attempt.takenAt).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatAttemptTime(takenAt: string) {
  return new Date(takenAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function AttemptHistoryRow({
  entry,
  deleting,
  deleteDisabled,
  onDelete,
  onRetake,
}: {
  entry: AttemptHistoryEntry;
  deleting: boolean;
  deleteDisabled: boolean;
  onDelete: () => void;
  onRetake: () => void;
}) {
  const passed = attemptPassed(entry.attempt, entry.targetScore);

  return (
    <li className="group relative flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-within:border-zinc-300 focus-within:shadow-md">
      <CardShine />
      <Link
        to="/quizzes/$quizId/attempts/$attemptId"
        params={{ quizId: entry.quizId, attemptId: entry.attempt.id }}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-1"
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium text-zinc-900">
              {entry.quizTitle}
            </span>
            {entry.archived && (
              <Badge className="px-1.5 py-0 text-[10px] font-normal">Archived</Badge>
            )}
            {!entry.quizAvailable && (
              <Badge className="px-1.5 py-0 text-[10px] font-normal">Unavailable</Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            {formatAttemptTime(entry.attempt.takenAt)} · {entry.attempt.incorrectCount}{" "}
            {entry.attempt.incorrectCount === 1 ? "mistake" : "mistakes"}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-zinc-900">
            {entry.attempt.percentage}%
          </p>
          <p className="text-[11px] tabular-nums text-zinc-500">
            {entry.attempt.score}/{entry.attempt.total}
          </p>
        </div>
        <AttemptResultBadge passed={passed} className="shrink-0" />
      </Link>

      {!entry.archived && entry.quizAvailable && (
        <IconActionButton
          icon={RotateCcw}
          label="Retake quiz"
          className="shrink-0 text-zinc-500"
          onClick={onRetake}
        />
      )}
      <IconActionButton
        icon={Trash2}
        label={deleting ? "Deleting attempt…" : "Delete attempt"}
        disabled={deleteDisabled}
        className="shrink-0 text-zinc-500 hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50 focus-visible:text-red-700"
        onClick={onDelete}
      />
    </li>
  );
}

export function AttemptHistoryPage() {
  const { goals, isLoading: goalsLoading, deleteAttempt } = useGoals();
  const { quizzes, isLoading: quizzesLoading } = useQuizLibrary();
  const { openQuizStart } = useQuizStartDialog();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [quizId, setQuizId] = useState("all");
  const [sort, setSort] = useState<AttemptHistorySort>("newest");
  const [visibleCount, setVisibleCount] = useState(HISTORY_BATCH_SIZE);
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(null);

  const allEntries = useMemo(
    () => collectAttemptHistory(goals, quizzes),
    [goals, quizzes],
  );
  const quizOptions = useMemo(() => {
    const options = new Map<
      string,
      Pick<AttemptHistoryEntry, "quizId" | "quizTitle" | "archived" | "quizAvailable">
    >();
    for (const entry of allEntries) {
      options.set(entry.quizId, entry);
    }
    return [...options.values()].sort((a, b) =>
      a.quizTitle.localeCompare(b.quizTitle),
    );
  }, [allEntries]);

  const resolvedQuizId =
    quizId === "all" || quizOptions.some((option) => option.quizId === quizId)
      ? quizId
      : "all";
  const filteredEntries = useMemo(
    () =>
      filterAttemptHistory(allEntries, {
        query: deferredQuery,
        quizId: resolvedQuizId === "all" ? "" : resolvedQuizId,
        sort,
      }),
    [allEntries, deferredQuery, resolvedQuizId, sort],
  );
  const stats = useMemo(
    () => attemptHistoryStats(filteredEntries),
    [filteredEntries],
  );
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, AttemptHistoryEntry[]>();
    for (const entry of filteredEntries.slice(0, visibleCount)) {
      const key = attemptLocalDateKey(entry.attempt.takenAt);
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    }
    return [...groups.values()];
  }, [filteredEntries, visibleCount]);

  function handleQuizChange(value: string) {
    setQuizId(value);
    setVisibleCount(HISTORY_BATCH_SIZE);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setVisibleCount(HISTORY_BATCH_SIZE);
  }

  function handleSortChange(value: AttemptHistorySort) {
    setSort(value);
    setVisibleCount(HISTORY_BATCH_SIZE);
  }

  async function handleDelete(entry: AttemptHistoryEntry) {
    if (deletingAttemptId) return;
    const approved = await confirm(
      `Delete this attempt for "${entry.quizTitle}"? This cannot be undone.`,
      { title: "Delete attempt?", kind: "warning" },
    );
    if (!approved) return;

    setDeletingAttemptId(entry.attempt.id);
    await deleteAttempt(entry.goalId, entry.attempt.id);
    setDeletingAttemptId(null);
  }

  if (goalsLoading || quizzesLoading) {
    return (
      <PageShell>
        <LoadingState message="Loading attempt history…" />
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-6">
      <PageHeader
        title="History"
        description="Review saved attempts, compare your results, and return to quizzes that need more practice."
      />

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 shadow-sm sm:grid-cols-4">
        {[
          ["Attempts", String(stats.count)],
          [
            "Average score",
            stats.averageScore === undefined ? "—" : `${stats.averageScore}%`,
          ],
          ["Best score", stats.bestScore === undefined ? "—" : `${stats.bestScore}%`],
          ["Pass rate", stats.passRate === undefined ? "—" : `${stats.passRate}%`],
        ].map(([label, value]) => (
          <div key={label} className="bg-zinc-50 px-4 py-3">
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-zinc-950">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <section aria-label="History filters">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,1fr)_repeat(2,minmax(10rem,auto))]">
          <SearchField
            value={query}
            onChange={handleQueryChange}
            placeholder="Search quiz titles or tags"
            pending={query !== deferredQuery}
            className="sm:col-span-2 lg:col-span-1"
          />
          <Select value={resolvedQuizId} onValueChange={handleQuizChange}>
            <SelectTrigger aria-label="Filter by quiz">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All quizzes</SelectItem>
              {quizOptions.map((option) => (
                <SelectItem key={option.quizId} value={option.quizId}>
                  {option.quizTitle}
                  {option.archived ? " (Archived)" : ""}
                  {!option.quizAvailable ? " (Unavailable)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(value) =>
              handleSortChange(value as AttemptHistorySort)
            }
          >
            <SelectTrigger aria-label="Sort attempt history">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {allEntries.length === 0 ? (
        <EmptyState
          title="No saved attempts yet"
          description="Attempts are recorded when you complete a quiz that has a goal. Choose a quiz to start building your history."
          icon={
            <History
              className="mx-auto mb-4 size-9 text-zinc-400"
              aria-hidden="true"
            />
          }
          action={
            <Link to="/" className={buttonClassName({ className: "mt-6" })}>
              Browse quizzes
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {groupedEntries.map((entries) => (
            <section key={attemptLocalDateKey(entries[0].attempt.takenAt)}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {formatAttemptDay(entries[0])}
              </h2>
              <ul className="space-y-2">
                {entries.map((entry) => (
                  <AttemptHistoryRow
                    key={`${entry.goalId}:${entry.attempt.id}`}
                    entry={entry}
                    deleting={deletingAttemptId === entry.attempt.id}
                    deleteDisabled={deletingAttemptId !== null}
                    onRetake={() => openQuizStart({ quizId: entry.quizId })}
                    onDelete={() => void handleDelete(entry)}
                  />
                ))}
              </ul>
            </section>
          ))}

          {visibleCount < filteredEntries.length && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setVisibleCount((count) => count + HISTORY_BATCH_SIZE)}
            >
              Load more
            </Button>
          )}
        </div>
      )}
    </PageShell>
  );
}
