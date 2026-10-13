import { useState } from "react";
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
}) {
  const [studyRevealed, setStudyRevealed] = useState(!concealAnswers);
  const revealed = studyRevealed;
  const studyPlaceholder = concealAnswers && !revealed;

  return (
    <div
      className={cn(
        "grid w-full gap-3 md:grid-cols-2 md:items-start",
        className,
      )}
    >
      <ReviewQuestionDetail
        question={question}
        index={index}
        record={record}
        concealAnswers={concealAnswers}
        onStudyRevealChange={setStudyRevealed}
        showExplanation={false}
        compact
        flat={flat}
        className="h-full"
      />

      <aside
        className={cn(
          "flex min-w-0 flex-col gap-3",
          flat ? "border-t border-zinc-200/60 pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-1" : "pt-3",
        )}
      >
        {question.explanation && (
          <QuestionExplanation
            explanation={question.explanation}
            placeholder={studyPlaceholder ? STUDY_EXPLANATION_PLACEHOLDER : undefined}
          />
        )}
        {quizId && (
          <QuestionKnowledgeNotesPanel
            quizId={quizId}
            questionId={question.id}
            currentNoteId={currentNoteId}
            noteDialogLayer={noteDialogLayer}
            placeholder={studyPlaceholder ? STUDY_REFERENCES_PLACEHOLDER : undefined}
          />
        )}
      </aside>
    </div>
  );
}
