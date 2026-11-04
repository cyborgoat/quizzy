import { confirm } from "@tauri-apps/plugin-dialog";
import { Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { AttemptHistoryTable } from "@/components/goals/AttemptHistoryTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/quiz/EmptyState";
import { LoadingState } from "@/components/quiz/LoadingState";
import { buttonClassName } from "@/components/ui/button-styles";
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
  collectAttemptHistory,
  filterAttemptHistory,
  type AttemptHistoryEntry,
  type AttemptHistorySort,
} from "@/lib/recentAttempts";

export function AttemptHistoryPage() {
  const { goals, isLoading: goalsLoading, deleteAttempt } = useGoals();
  const { quizzes, isLoading: quizzesLoading } = useQuizLibrary();
  const { openQuizStart } = useQuizStartDialog();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [quizId, setQuizId] = useState("all");
  const [sort, setSort] = useState<AttemptHistorySort>("newest");
  const [deletingAttemptId, setDeletingAttemptId] = useState<string | null>(
    null,
  );

  const allEntries = useMemo(
    () => collectAttemptHistory(goals, quizzes),
    [goals, quizzes],
  );
  const quizOptions = useMemo(() => {
    const options = new Map<
      string,
      Pick<
        AttemptHistoryEntry,
        "quizId" | "quizTitle" | "archived" | "quizAvailable"
      >
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
  function handleQuizChange(value: string) {
    setQuizId(value);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
  }

  function handleSortChange(value: AttemptHistorySort) {
    setSort(value);
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
      <PageShell layout="workspace">
        <LoadingState message="Loading attempt history…" />
      </PageShell>
    );
  }

  return (
    <PageShell layout="workspace">
      <PageHeader
        title="History"
        description="Review saved attempts and track your progress."
        className="shrink-0 [@media(max-height:699px)]:[&>div>p:first-of-type]:hidden"
      />

      <dl className="grid shrink-0 grid-cols-4 gap-4 py-2">
        {[
          ["Attempts", String(stats.count)],
          [
            "Average score",
            stats.averageScore === undefined ? "—" : `${stats.averageScore}%`,
          ],
          [
            "Best score",
            stats.bestScore === undefined ? "—" : `${stats.bestScore}%`,
          ],
          [
            "Pass rate",
            stats.passRate === undefined ? "—" : `${stats.passRate}%`,
          ],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-zinc-950">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <section aria-label="History filters" className="shrink-0">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,10rem)_minmax(0,9rem)] gap-2">
          <SearchField
            value={query}
            onChange={handleQueryChange}
            placeholder="Search quiz titles or tags"
            pending={query !== deferredQuery}
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
        <div className="min-h-0 flex-1 overflow-auto">
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
        </div>
      ) : (
        <AttemptHistoryTable
          key={`${deferredQuery}:${resolvedQuizId}:${sort}`}
          entries={filteredEntries}
          deletingAttemptId={deletingAttemptId}
          onRetake={(entry) => openQuizStart({ quizId: entry.quizId })}
          onDelete={(entry) => void handleDelete(entry)}
        />
      )}
    </PageShell>
  );
}
