import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { MistakeReviewDrawer } from "@/components/mistakes/MistakeReviewDrawer";
import { PageShell } from "@/components/layout/PageShell";
import { Route } from "@/routes/_app/mistakes/index";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/quiz/EmptyState";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMistakeLog } from "@/hooks/useMistakeLog";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { detectEmptyReason, entryKey, formatMistakeDate } from "@/lib/mistakeLog";
import type { MistakeEntry } from "@/types/mistakeLog";

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950 xl:text-3xl">{value}</p>
    </div>
  );
}

function EmptyMistakeLog({
  reason,
  thresholds,
  scopedQuizTitle,
}: {
  reason: "no_attempts" | "no_mistakes" | "thresholds_exclude_all";
  thresholds: { minMistakes: number; maxCorrectnessPercentage: number };
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
        title={`${scopePrefix}No mistakes found`}
        description="No mistakes found in your scored attempts."
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
        below {thresholds.maxCorrectnessPercentage}%. Adjust thresholds in Settings.
      </p>
      <Link
        to="/settings"
        className="mt-6 inline-flex h-8 items-center justify-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Open Settings
      </Link>
    </section>
  );
}

export function MistakeLogPage() {
  const { quizId: scopedQuizId } = Route.useSearch();
  const {
    qualifyingEntries,
    rawEntries,
    attemptData,
    summary,
    emptyReason,
    quizzesWithMistakes,
    thresholds,
    isLoading,
    error,
    refetch,
    filterByQuiz,
  } = useMistakeLog();
  const { quizzes } = useQuizLibrary();
  const [quizFilter, setQuizFilter] = useState<string>("all");
  const [activeEntry, setActiveEntry] = useState<MistakeEntry | null>(null);

  const isQuizScoped = Boolean(scopedQuizId);
  const scopedQuizTitle =
    scopedQuizId &&
    (quizzes.find((source) => source.quiz.id === scopedQuizId)?.quiz.title ??
      qualifyingEntries.find((entry) => entry.quizId === scopedQuizId)?.quizTitle);

  const visibleEntries = useMemo(() => {
    const quizId = isQuizScoped ? scopedQuizId : quizFilter === "all" ? undefined : quizFilter;
    return filterByQuiz(qualifyingEntries, quizId);
  }, [qualifyingEntries, filterByQuiz, isQuizScoped, scopedQuizId, quizFilter]);

  const scopedSummary = useMemo(() => {
    if (visibleEntries.length === qualifyingEntries.length) return summary;
    return {
      qualifyingCount: visibleEntries.length,
      totalMistakeEvents: visibleEntries.reduce((sum, entry) => sum + entry.mistakeCount, 0),
      quizCount: new Set(visibleEntries.map((entry) => entry.quizId)).size,
    };
  }, [visibleEntries, qualifyingEntries.length, summary]);

  const scopedEmptyReason = useMemo(() => {
    if (visibleEntries.length > 0) return null;

    if (isQuizScoped && scopedQuizId) {
      const quizAttempts = attemptData.filter((attempt) => attempt.quizId === scopedQuizId);
      const quizRaw = rawEntries.filter((entry) => entry.quizId === scopedQuizId);
      const hasQuizMistakes = quizRaw.some((entry) => entry.mistakeCount > 0);
      return detectEmptyReason(quizAttempts.length > 0, hasQuizMistakes, visibleEntries.length);
    }

    return emptyReason;
  }, [
    visibleEntries.length,
    isQuizScoped,
    scopedQuizId,
    attemptData,
    rawEntries,
    emptyReason,
  ]);

  const activeQuestion = useMemo(() => {
    if (!activeEntry) return null;
    const source = quizzes.find((item) => item.quiz.id === activeEntry.quizId);
    return source?.quiz.questions.find((question) => question.id === activeEntry.questionId) ?? null;
  }, [activeEntry, quizzes]);

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 xl:text-3xl">Mistake Log</h1>
        <p className="mt-1 text-sm text-zinc-500 lg:text-base">
          Threshold-filtered mistakes from scored attempts, sorted by frequency. Click a question
          to review the correct answer and explanation.
        </p>
        {isQuizScoped && scopedQuizTitle && (
          <p className="mt-2 text-sm font-medium text-zinc-700">{scopedQuizTitle}</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Unable to load mistake data</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap items-center gap-3">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Qualifying mistakes" value={scopedSummary.qualifyingCount} />
        <SummaryCard label="Total mistake events" value={scopedSummary.totalMistakeEvents} />
        <SummaryCard label="Quizzes represented" value={scopedSummary.quizCount} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        {!isQuizScoped && (
          <div className="min-w-0 flex-1">
            <Label htmlFor="quiz-filter">Quiz</Label>
            <Select value={quizFilter} onValueChange={setQuizFilter}>
              <SelectTrigger id="quiz-filter" className="mt-1.5 max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All quizzes</SelectItem>
                {quizzesWithMistakes.map((quiz) => (
                  <SelectItem key={quiz.quizId} value={quiz.quizId}>
                    {quiz.quizTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="text-xs text-zinc-500">
          Thresholds: ≥{thresholds.minMistakes} mistake(s), ≤{thresholds.maxCorrectnessPercentage}%
          correctness{" "}
          <Link to="/settings" className="font-medium text-zinc-700 underline-offset-2 hover:underline">
            <Settings className="mr-0.5 inline size-3" />
            Settings
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading mistake data…</p>
      ) : scopedEmptyReason ? (
        <EmptyMistakeLog
          reason={scopedEmptyReason}
          thresholds={thresholds}
          scopedQuizTitle={isQuizScoped ? (scopedQuizTitle ?? undefined) : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <ul className="divide-y divide-zinc-100">
            {visibleEntries.map((entry) => {
              const key = entryKey(entry);
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setActiveEntry(entry)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-950 lg:text-base">{entry.prompt}</p>
                      {!isQuizScoped && (
                        <p className="mt-0.5 text-xs text-zinc-500">{entry.quizTitle}</p>
                      )}
                    </div>
                    <dl className="grid shrink-0 gap-1 text-right text-xs">
                      <div>
                        <dt className="sr-only">Mistake count</dt>
                        <dd className="font-semibold tabular-nums text-zinc-950">
                          {entry.mistakeCount} mistakes
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">Correctness</dt>
                        <dd className="tabular-nums text-zinc-500">
                          {entry.correctnessPercentage}% correct
                        </dd>
                      </div>
                      <div>
                        <dt className="sr-only">Last mistaken</dt>
                        <dd className="text-zinc-500">{formatMistakeDate(entry.lastMistakenAt)}</dd>
                      </div>
                    </dl>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <MistakeReviewDrawer
        entry={activeEntry}
        question={activeQuestion}
        open={activeEntry !== null}
        onOpenChange={(open) => {
          if (!open) setActiveEntry(null);
        }}
      />
    </PageShell>
  );
}
