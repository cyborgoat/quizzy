import { ReviewQuestionNavigationBar } from "@/components/quiz/ReviewQuestionNavigationBar";
import { ReviewQuestionSplitPanel } from "@/components/quiz/ReviewQuestionSplitPanel";
import { buildMistakeAnswerRecord } from "@/lib/mistakeLogReview";
import { formatShortDate } from "@/lib/formatDate";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { QuizQuestion } from "@/types/quiz";

export function MistakeLogQuestionReviewCard({
  entry,
  question,
  questionIndex,
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
  position: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  disablePrevious: boolean;
  disableNext: boolean;
}) {
  const record = buildMistakeAnswerRecord(entry, question);

  return (
    <section className="mt-3 shrink-0 rounded-lg border border-zinc-200 bg-white p-3 lg:p-4">
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-zinc-950">Review mistake</h2>
        <p className="mt-1 text-xs text-zinc-500">
          {entry.quizTitle} · {entry.mistakeCount} mistake
          {entry.mistakeCount === 1 ? "" : "s"} · Last mistaken{" "}
          {formatShortDate(entry.lastMistakenAt)} · {entry.flaggedCount} flag
          {entry.flaggedCount === 1 ? "" : "s"}
        </p>
      </header>

      <div className="space-y-3" aria-label="Mistake review">
        <ReviewQuestionNavigationBar
          position={position}
          total={total}
          onPrevious={onPrevious}
          onNext={onNext}
          disablePrevious={disablePrevious}
          disableNext={disableNext}
        />

        {question ? (
          <ReviewQuestionSplitPanel
            key={`${entry.quizId}:${entry.questionId}`}
            question={question}
            index={questionIndex}
            record={record}
            quizId={entry.quizId}
            concealAnswers
          />
        ) : (
          <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-semibold text-zinc-950">{entry.prompt}</p>
            <p className="mt-3 text-sm text-zinc-600">
              This question could not be loaded from the quiz file. It may have been removed or
              the quiz file is unavailable.
            </p>
          </article>
        )}
      </div>
    </section>
  );
}
