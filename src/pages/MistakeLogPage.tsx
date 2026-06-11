import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyMistakeLog } from "@/components/mistake-log/EmptyMistakeLog";
import { MistakeLogReviewSection } from "@/components/mistake-log/MistakeLogReviewSection";
import { MistakeLogTable } from "@/components/mistake-log/MistakeLogTable";
import { Route } from "@/routes/_app/mistakes/index";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useGoals } from "@/hooks/useGoals";
import { useMistakeLog } from "@/hooks/useMistakeLog";
import { useMistakeLogPageState } from "@/hooks/useMistakeLogPageState";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";

export function MistakeLogPage() {
  const { quizId: scopedQuizId } = Route.useSearch();
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
    isQuizScoped,
    scopedQuizTitle,
    scopedEmptyReason,
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
    emptyReason,
    quizzesWithMistakes,
    scopedQuizId,
    goals,
    quizzes,
    getNotesForQuestion,
  });

  return (
    <PageShell className="space-y-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-950 lg:text-2xl">Mistake Log</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Threshold-filtered mistakes plus flagged questions from scored attempts. Click a question
          to review the answer and explanation.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Thresholds: ≥{thresholds.minMistakes} mistake(s), ≥{thresholds.minFlags} flag(s), ≤
          {thresholds.maxCorrectnessPercentage}% correctness. Adjust in{" "}
          <Link to="/settings" className="font-medium text-zinc-700 underline-offset-2 hover:underline">
            <Settings className="mr-0.5 inline size-3" />
            Settings
          </Link>
          .
        </p>
        {isQuizScoped && scopedQuizTitle && (
          <p className="mt-1 text-sm font-medium text-zinc-700">{scopedQuizTitle}</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
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

      {isLoading ? (
        <p className="py-12 text-center text-sm text-zinc-500">Loading mistake data…</p>
      ) : scopedEmptyReason ? (
        <EmptyMistakeLog
          reason={scopedEmptyReason}
          thresholds={thresholds}
          scopedQuizTitle={isQuizScoped ? (scopedQuizTitle ?? undefined) : undefined}
        />
      ) : (
        <>
          <MistakeLogTable
            table={table}
            activeEntry={activeEntry}
            entryCount={sortedEntries.length}
            expanded={isMistakeListExpanded}
            onExpandedChange={setIsMistakeListExpanded}
            onSelectEntry={selectEntry}
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
              disableNext={activePosition < 0 || activePosition >= sortedEntries.length - 1}
            />
          )}
        </>
      )}
    </PageShell>
  );
}
