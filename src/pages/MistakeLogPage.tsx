import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { Settings } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyMistakeLog } from "@/components/mistake-log/EmptyMistakeLog";
import { MistakeLogReviewSection } from "@/components/mistake-log/MistakeLogReviewSection";
import { MistakeLogTable } from "@/components/mistake-log/MistakeLogTable";
import { Route } from "@/routes/_app/mistakes/index";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/quiz/LoadingState";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useGoals } from "@/hooks/useGoals";
import { useMistakeLog } from "@/hooks/useMistakeLog";
import { useMistakeLogPageState } from "@/hooks/useMistakeLogPageState";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";

export function MistakeLogPage() {
  const { quizId } = Route.useSearch();
  const navigate = useNavigate();
  const quizFilter = quizId ?? "all";
  const setQuizFilter = useCallback(
    (value: string) =>
      void navigate({
        to: "/mistakes",
        search: value === "all" ? {} : { quizId: value },
        replace: true,
      }),
    [navigate],
  );
  const { goals } = useGoals();
  const {
    qualifyingEntries,
    rawEntries,
    emptyReason,
    quizzesWithMistakes,
    thresholds,
    isLoading,
    error,
    refetch,
  } = useMistakeLog();
  const { quizzes } = useQuizLibrary();
  const { getNotesForQuestion } = useKnowledgeLibrary();

  const {
    filteredEmptyMessage,
    clearFilters,
    isMistakeListExpanded,
    setIsMistakeListExpanded,
    studyMode,
    setStudyMode,
    table,
    sortedEntries,
    activeEntry,
    activePosition,
    activeQuestionContext,
    toggleShuffle,
    shuffleEnabled,
    selectEntry,
    goToPreviousMistake,
    goToNextMistake,
  } = useMistakeLogPageState({
    qualifyingEntries,
    rawEntries,
    quizzesWithMistakes,
    quizFilter,
    onQuizFilterChange: setQuizFilter,
    goals,
    quizzes,
    getNotesForQuestion,
  });

  return (
    <PageShell layout="workspace">
      <PageHeader
        title="Mistake Log"
        description="Review mistakes and flagged questions at your own pace."
        className="shrink-0 [@media(max-height:699px)]:[&>div>p:first-of-type]:hidden"
      >
        <p className="mt-1 text-xs text-zinc-500">
          Thresholds: ≥{thresholds.minMistakes} mistake(s), ≥
          {thresholds.minFlags} flag(s), ≤{thresholds.maxCorrectnessPercentage}%
          correctness. Adjust in{" "}
          <Link
            to="/settings"
            className="font-medium text-zinc-700 underline-offset-2 hover:underline"
          >
            <Settings className="mr-0.5 inline size-3" />
            Settings
          </Link>
          .
        </p>
      </PageHeader>

      {error && (
        <Alert
          variant="destructive"
          className="max-h-[20dvh] shrink-0 overflow-auto"
        >
          <AlertTitle>Unable to load mistake data</AlertTitle>
          <AlertDescription>
            <div className="flex flex-wrap items-center gap-3">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <LoadingState message="Loading mistake data…" className="py-12" />
      ) : emptyReason ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <EmptyMistakeLog reason={emptyReason} thresholds={thresholds} />
        </div>
      ) : (
        <>
          <MistakeLogTable
            table={table}
            activeEntry={activeEntry}
            entryCount={sortedEntries.length}
            expanded={isMistakeListExpanded}
            onExpandedChange={setIsMistakeListExpanded}
            onSelectEntry={selectEntry}
            emptyMessage={filteredEmptyMessage}
            onClearFilters={clearFilters}
          />

          {activeEntry && (
            <MistakeLogReviewSection
              entry={activeEntry}
              question={activeQuestionContext.question}
              questionIndex={activeQuestionContext.questionIndex}
              studyMode={studyMode}
              onStudyModeChange={setStudyMode}
              shuffleEnabled={shuffleEnabled}
              onToggleShuffle={toggleShuffle}
              position={activePosition + 1}
              total={sortedEntries.length}
              onPrevious={goToPreviousMistake}
              onNext={goToNextMistake}
              disablePrevious={activePosition <= 0}
              disableNext={
                activePosition < 0 || activePosition >= sortedEntries.length - 1
              }
            />
          )}
        </>
      )}
    </PageShell>
  );
}
