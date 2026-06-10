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
  className,
}: {
  question: QuizQuestion;
  index: number;
  record: AnswerRecord;
  quizId?: string;
  className?: string;
}) {
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
        showExplanation={false}
        compact
        className="h-full"
      />

      <aside className="flex min-w-0 flex-col gap-3">
        {question.explanation && (
          <QuestionExplanation explanation={question.explanation} compact />
        )}
        {quizId && (
          <QuestionKnowledgeNotesPanel
            quizId={quizId}
            questionId={question.id}
            compact
          />
        )}
      </aside>
    </div>
  );
}
