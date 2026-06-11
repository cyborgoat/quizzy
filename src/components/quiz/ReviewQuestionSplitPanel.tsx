import { useState } from "react";
import { QuestionKnowledgeNotesPanel } from "@/components/knowledge/QuestionKnowledgeNotesPanel";
import { QuestionExplanation } from "@/components/quiz/QuestionExplanation";
import { ReviewQuestionDetail } from "@/components/quiz/ReviewQuestionDetail";
import { cn } from "@/lib/utils";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

export function ReviewQuestionSplitPanel({
  question,
  index,
  record,
  quizId,
  currentNoteId,
  className,
  concealAnswers = false,
}: {
  question: QuizQuestion;
  index: number;
  record?: AnswerRecord;
  quizId?: string;
  currentNoteId?: string;
  className?: string;
  concealAnswers?: boolean;
}) {
  const [showAnswers, setShowAnswers] = useState(false);
  const revealed = !concealAnswers || showAnswers;

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
        showAnswers={concealAnswers ? showAnswers : undefined}
        onShowAnswersChange={concealAnswers ? setShowAnswers : undefined}
        showExplanation={false}
        compact
        className="h-full"
      />

      <aside className="flex min-w-0 flex-col gap-3">
        {question.explanation && revealed && (
          <QuestionExplanation explanation={question.explanation} compact />
        )}
        {quizId && (
          <QuestionKnowledgeNotesPanel
            quizId={quizId}
            questionId={question.id}
            currentNoteId={currentNoteId}
          />
        )}
      </aside>
    </div>
  );
}
