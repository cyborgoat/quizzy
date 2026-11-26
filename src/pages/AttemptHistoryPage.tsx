import { confirm } from "@tauri-apps/plugin-dialog";
import { Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useMemo, useState } from "react";
import { AttemptHistoryTable } from "@/components/goals/AttemptHistoryTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/quiz/EmptyState";
import { LoadingState } from "@/components/quiz/LoadingState";
import { buttonClassName } from "@/components/ui/button-styles";

import { useGoals } from "@/hooks/useGoals";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import {
  attemptHistoryStats,
  collectAttemptHistory,
  filterAttemptHistory,
  type AttemptHistoryEntry,
} from "@/lib/recentAttempts";
import { useI18n } from "@/lib/i18n";

export function AttemptHistoryPage() {
  const { t } = useI18n();

  const { goals, isLoading: goalsLoading, deleteAttempt } = useGoals();
  const { quizzes, isLoading: quizzesLoading } = useQuizLibrary();
  const { openQuizStart } = useQuizStartDialog();
  const [quizId, setQuizId] = useState("all");
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
        query: "",
        quizId: resolvedQuizId === "all" ? "" : resolvedQuizId,
        sort: "newest",
      }),
    [allEntries, resolvedQuizId],
  );
  const stats = useMemo(
    () => attemptHistoryStats(filteredEntries),
    [filteredEntries],
  );
  async function handleDelete(entry: AttemptHistoryEntry) {
    if (deletingAttemptId) return;
    const approved = await confirm(
      t("history.confirmDelete", { title: entry.quizTitle }),
      { title: t("history.confirmDeleteTitle"), kind: "warning" },
    );
    if (!approved) return;

    setDeletingAttemptId(entry.attempt.id);
    await deleteAttempt(entry.goalId, entry.attempt.id);
    setDeletingAttemptId(null);
  }

  if (goalsLoading || quizzesLoading) {
    return (
      <PageShell layout="workspace">
        <LoadingState message={t("history.loading")} />
      </PageShell>
    );
  }

  return (
    <PageShell layout="workspace">
      <PageHeader
        title={t("history.title")}
        description={t("history.description")}
        className="shrink-0 [@media(max-height:699px)]:[&>div>p:first-of-type]:hidden"
      />

      <dl className="grid shrink-0 grid-cols-4 gap-4 py-2">
        {[
          [t("history.stat.attempts"), String(stats.count)],
          [
            t("history.stat.average"),
            stats.averageScore === undefined ? "—" : `${stats.averageScore}%`,
          ],
          [
            t("history.stat.best"),
            stats.bestScore === undefined ? "—" : `${stats.bestScore}%`,
          ],
          [
            t("history.stat.passRate"),
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

      {allEntries.length === 0 ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <EmptyState
            title={t("history.empty.title")}
            description={t("history.empty.description")}
            icon={
              <History
                className="mx-auto mb-4 size-9 text-zinc-400"
                aria-hidden="true"
              />
            }
            action={
              <Link to="/" className={buttonClassName({ className: "mt-6" })}>
                {t("history.empty.browse")}
              </Link>
            }
          />
        </div>
      ) : (
        <AttemptHistoryTable
          entries={filteredEntries}
          quizFilter={resolvedQuizId}
          quizOptions={[
            { value: "all", label: t("history.allQuizzes") },
            ...quizOptions.map((option) => ({
              value: option.quizId,
              label: `${option.quizTitle}${option.archived ? ` ${t("history.archivedSuffix")}` : ""}${!option.quizAvailable ? ` ${t("history.unavailableSuffix")}` : ""}`,
            })),
          ]}
          onQuizFilterChange={setQuizId}
          deletingAttemptId={deletingAttemptId}
          onRetake={(entry) => openQuizStart({ quizId: entry.quizId })}
          onDelete={(entry) => void handleDelete(entry)}
        />
      )}
    </PageShell>
  );
}
