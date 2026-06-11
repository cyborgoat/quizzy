import { BookOpen, Shuffle } from "lucide-react";
import { QuestionReviewCard } from "@/components/quiz/QuestionReviewCard";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { formatShortDate } from "@/lib/formatDate";
import { buildMistakeAnswerRecord } from "@/lib/mistakeLogReview";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { QuizQuestion } from "@/types/quiz";
import { MistakeStatusBadge } from "./MistakeStatusBadge";

export function MistakeLogReviewSection({
  entry,
  question,
  questionIndex,
  studyMode,
  onStudyModeChange,
  shuffleEnabled,
  onToggleShuffle,
  position,
  total,
  onPrevious,
  onNext,
  disablePrevious,
  disableNext,
}: {
  entry: MistakeEntry;
  question: QuizQuestion | null;
  questionIndex: number;
  studyMode: boolean;
  onStudyModeChange: (enabled: boolean) => void;
  shuffleEnabled: boolean;
  onToggleShuffle: () => void;
  position: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  disablePrevious: boolean;
  disableNext: boolean;
}) {
  return (
    <QuestionReviewCard
      header={
        <>
          <h2 className="text-sm font-semibold text-zinc-950">Review mistake</h2>
          <div className="mt-1 flex items-center gap-x-2 text-xs text-zinc-500">
            <span className="truncate">{entry.quizTitle}</span>
            <span className="shrink-0 text-zinc-300" aria-hidden="true">
              ·
            </span>
            <span className="shrink-0">
              Last mistaken {formatShortDate(entry.lastMistakenAt)}
            </span>
            <MistakeStatusBadge count={entry.mistakeCount} variant="mistakes" />
            <MistakeStatusBadge count={entry.flaggedCount} variant="flags" />
          </div>
        </>
      }
      headerActions={
        <>
          <IconActionButton
            icon={Shuffle}
            label={shuffleEnabled ? "Sorted order" : "Shuffle order"}
            variant={shuffleEnabled ? "default" : "outline"}
            onClick={onToggleShuffle}
          />
          <IconActionButton
            icon={BookOpen}
            label={studyMode ? "Review mode" : "Study mode"}
            variant={studyMode ? "default" : "outline"}
            onClick={() => onStudyModeChange(!studyMode)}
          />
        </>
      }
      question={question}
      questionIndex={questionIndex}
      record={buildMistakeAnswerRecord(entry, question)}
      quizId={entry.quizId}
      concealAnswers={studyMode}
      position={position}
      total={total}
      onPrevious={onPrevious}
      onNext={onNext}
      disablePrevious={disablePrevious}
      disableNext={disableNext}
      panelKey={`${entry.quizId}:${entry.questionId}:${studyMode ? "study" : "review"}`}
      unavailablePrompt={entry.prompt}
    />
  );
}
