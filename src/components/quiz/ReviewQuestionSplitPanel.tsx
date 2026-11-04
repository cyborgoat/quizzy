import { useId, useRef, useState } from "react";
import type { DialogStackLayer } from "@/components/ui/resizable-dialog-shell";
import { QuestionKnowledgeNotesPanel } from "@/components/knowledge/QuestionKnowledgeNotesPanel";
import { QuestionExplanation } from "@/components/quiz/QuestionExplanation";
import { ReviewQuestionDetail } from "@/components/quiz/ReviewQuestionDetail";
import { cn } from "@/lib/utils";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

const STUDY_EXPLANATION_PLACEHOLDER =
  "Submit your answer to see the explanation.";
const STUDY_REFERENCES_PLACEHOLDER =
  "Submit your answer to see the references.";

export function ReviewQuestionSplitPanel({
  question,
  index,
  record,
  quizId,
  currentNoteId,
  noteDialogLayer,
  className,
  concealAnswers = false,
  flat = false,
  layout = "flow",
}: {
  question: QuizQuestion;
  index: number;
  record?: AnswerRecord;
  quizId?: string;
  currentNoteId?: string;
  noteDialogLayer?: DialogStackLayer;
  className?: string;
  concealAnswers?: boolean;
  flat?: boolean;
  layout?: "flow" | "workspace";
}) {
  const [studyRevealed, setStudyRevealed] = useState(!concealAnswers);
  const [activeTab, setActiveTab] = useState<"question" | "explanation">(
    "question",
  );
  const tabsId = useId();
  const tabsRef = useRef<HTMLDivElement>(null);
  const studyPlaceholder = concealAnswers && !studyRevealed;
  const workspace = layout === "workspace";

  const questionDetail = (
    <ReviewQuestionDetail
      question={question}
      index={index}
      record={record}
      concealAnswers={concealAnswers}
      onStudyRevealChange={setStudyRevealed}
      showExplanation={false}
      compact
      flat={workspace || flat}
      className={workspace ? undefined : "h-full"}
    />
  );
  const explanation = (
    <>
      {question.explanation ? (
        <QuestionExplanation
          explanation={question.explanation}
          placeholder={
            studyPlaceholder ? STUDY_EXPLANATION_PLACEHOLDER : undefined
          }
        />
      ) : workspace ? (
        <p className="text-xs text-zinc-500">No explanation provided.</p>
      ) : null}
      {quizId && (
        <QuestionKnowledgeNotesPanel
          quizId={quizId}
          questionId={question.id}
          currentNoteId={currentNoteId}
          noteDialogLayer={noteDialogLayer}
          placeholder={
            studyPlaceholder ? STUDY_REFERENCES_PLACEHOLDER : undefined
          }
        />
      )}
    </>
  );

  if (!workspace) {
    return (
      <div
        className={cn(
          "grid w-full gap-3 md:grid-cols-2 md:items-start",
          className,
        )}
      >
        {questionDetail}
        <aside
          className={cn(
            "flex min-w-0 flex-col gap-3",
            flat
              ? "border-t border-zinc-200/60 pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-1"
              : "pt-3",
          )}
        >
          {explanation}
        </aside>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col overflow-hidden",
        className,
      )}
    >
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="Review content"
        className="flex shrink-0 gap-4 border-b border-zinc-200 md:hidden"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          event.stopPropagation();
          const next =
            event.key === "Home"
              ? "question"
              : event.key === "End"
                ? "explanation"
                : activeTab === "question"
                  ? "explanation"
                  : "question";
          setActiveTab(next);
          tabsRef.current
            ?.querySelector<HTMLButtonElement>(`[id="${tabsId}-${next}-tab"]`)
            ?.focus();
        }}
      >
        {(["question", "explanation"] as const).map((tab) => (
          <button
            key={tab}
            id={`${tabsId}-${tab}-tab`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`${tabsId}-${tab}-panel`}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "border-b-2 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500",
              activeTab === tab
                ? "border-zinc-900 text-zinc-950"
                : "border-transparent text-zinc-500",
            )}
          >
            {tab === "question" ? "Question" : "Explanation & references"}
          </button>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] md:grid-cols-2">
        <div
          id={`${tabsId}-question-panel`}
          role="tabpanel"
          aria-label="Question and answer choices"
          tabIndex={0}
          className={cn(
            "min-h-0 min-w-0 overflow-auto overscroll-contain py-3 pr-2 [scrollbar-gutter:stable] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 md:pr-4",
            activeTab !== "question" && "hidden md:block",
          )}
        >
          {questionDetail}
        </div>
        <div
          id={`${tabsId}-explanation-panel`}
          role="tabpanel"
          aria-label="Explanation and references"
          tabIndex={0}
          className={cn(
            "min-h-0 min-w-0 overflow-auto overscroll-contain py-3 pr-2 [scrollbar-gutter:stable] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-400 md:border-l md:border-zinc-200 md:pl-4",
            activeTab !== "explanation" && "hidden md:block",
          )}
        >
          <aside className="flex min-w-0 flex-col gap-5">{explanation}</aside>
        </div>
      </div>
    </div>
  );
}
