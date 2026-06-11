import { ReviewQuestionNavigationBar } from "@/components/quiz/ReviewQuestionNavigationBar";
import { ReviewQuestionSplitPanel } from "@/components/quiz/ReviewQuestionSplitPanel";
import { UnavailableQuestionCard } from "@/components/quiz/UnavailableQuestionMessage";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";
import type { ReactNode } from "react";

export function QuestionReviewCard({
  header,
  headerActions,
  question,
  questionIndex,
  record,
  quizId,
  concealAnswers = false,
  position,
  total,
  onPrevious,
  onNext,
  disablePrevious,
  disableNext,
  panelKey,
  unavailablePrompt,
}: {
  header?: ReactNode;
  headerActions?: ReactNode;
  question: QuizQuestion | null;
  questionIndex: number;
  record?: AnswerRecord;
  quizId?: string;
  concealAnswers?: boolean;
  position: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  disablePrevious: boolean;
  disableNext: boolean;
  panelKey?: string;
  unavailablePrompt?: string;
}) {
  const showHeader = Boolean(header || headerActions);

  return (
    <section className="shrink-0 rounded-lg border border-zinc-200 bg-white p-3 lg:p-4">
      {showHeader && (
        <header className="mb-3 flex items-start justify-between gap-3">
          {header ? <div className="min-w-0">{header}</div> : null}
          {headerActions ? (
            <div className="flex shrink-0 items-center gap-3">{headerActions}</div>
          ) : null}
        </header>
      )}

      <div className="space-y-3" aria-label="Question review">
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
            key={panelKey}
            question={question}
            index={questionIndex}
            record={record}
            quizId={quizId}
            concealAnswers={concealAnswers}
          />
        ) : (
          <UnavailableQuestionCard prompt={unavailablePrompt} />
        )}
      </div>
    </section>
  );
}
