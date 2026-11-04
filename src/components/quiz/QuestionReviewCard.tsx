import { ReviewQuestionNavigationBar } from "@/components/quiz/ReviewQuestionNavigationBar";
import { ReviewQuestionSplitPanel } from "@/components/quiz/ReviewQuestionSplitPanel";
import { UnavailableQuestionCard } from "@/components/quiz/UnavailableQuestionMessage";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  flat = false,
  layout = "flow",
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
  flat?: boolean;
  layout?: "flow" | "workspace";
}) {
  const workspace = layout === "workspace";
  const showHeader = Boolean(header || headerActions);

  return (
    <section
      className={cn(
        workspace
          ? "flex min-h-0 flex-1 flex-col overflow-hidden"
          : "shrink-0 p-3 lg:p-4",
        workspace
          ? "bg-white"
          : flat
            ? "rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm"
            : "rounded-lg border border-zinc-200 bg-white",
      )}
    >
      {showHeader && (
        <header
          className={cn(
            "flex items-start justify-between gap-3",
            workspace
              ? "shrink-0 flex-wrap pb-2"
              : "mb-3",
          )}
        >
          {header ? (
            <div className={cn("min-w-0", workspace && "flex-1")}>{header}</div>
          ) : null}
          {headerActions ? (
            <div
              className={cn(
                "flex shrink-0 items-center",
                workspace ? "gap-2" : "gap-3",
              )}
            >
              {headerActions}
            </div>
          ) : null}
          {workspace && (
            <ReviewQuestionNavigationBar
              position={position}
              total={total}
              onPrevious={onPrevious}
              onNext={onNext}
              disablePrevious={disablePrevious}
              disableNext={disableNext}
            />
          )}
        </header>
      )}

      <div
        className={workspace ? "flex min-h-0 flex-1 flex-col" : "space-y-3"}
        aria-label="Question review"
      >
        {(!workspace || !showHeader) && (
          <ReviewQuestionNavigationBar
            position={position}
            total={total}
            onPrevious={onPrevious}
            onNext={onNext}
            disablePrevious={disablePrevious}
            disableNext={disableNext}
          />
        )}

        {question ? (
          <ReviewQuestionSplitPanel
            key={panelKey}
            question={question}
            index={questionIndex}
            record={record}
            quizId={quizId}
            concealAnswers={concealAnswers}
            flat={workspace || flat}
            layout={layout}
          />
        ) : (
          <div
            key={panelKey}
            className={
              workspace ? "min-h-0 flex-1 overflow-auto py-3" : undefined
            }
          >
            <UnavailableQuestionCard
              prompt={unavailablePrompt}
              flat={workspace}
            />
          </div>
        )}
      </div>
    </section>
  );
}
