import { useState } from "react";
import type { DialogStackLayer } from "@/components/ui/resizable-dialog-shell";
import { QuestionKnowledgeNotesPanel } from "@/components/knowledge/QuestionKnowledgeNotesPanel";
import { QuestionExplanation } from "@/components/quiz/QuestionExplanation";
import { ReviewQuestionDetail } from "@/components/quiz/ReviewQuestionDetail";
import { cn } from "@/lib/utils";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

const STUDY_EXPLANATION_PLACEHOLDER =
  "Answer the question and submit to see the explanation, or turn off Study mode.";

export function ReviewQuestionSplitPanel({
  question,
  index,
  record,
  quizId,
  currentNoteId,
  noteDialogLayer,
  className,
  concealAnswers = false,
}: {
  question: QuizQuestion;
  index: number;
  record?: AnswerRecord;
  quizId?: string;
  currentNoteId?: string;
  noteDialogLayer?: DialogStackLayer;
  className?: string;
  concealAnswers?: boolean;
}) {
  const [studyRevealed, setStudyRevealed] = useState(!concealAnswers);
  const revealed = studyRevealed;

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
        className="h-full"
      />

      <aside className="flex min-w-0 flex-col gap-3">
        {question.explanation && (
          <QuestionExplanation
            explanation={question.explanation}
            compact
            placeholder={
              concealAnswers && !revealed ? STUDY_EXPLANATION_PLACEHOLDER : undefined
            }
          />
        )}
        {quizId && (
          <QuestionKnowledgeNotesPanel
            quizId={quizId}
            questionId={question.id}
            currentNoteId={currentNoteId}
            noteDialogLayer={noteDialogLayer}
          />
        )}
      </aside>
    </div>
  );
}
