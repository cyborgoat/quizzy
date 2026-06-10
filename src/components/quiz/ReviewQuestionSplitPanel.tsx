import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { QuestionKnowledgeNotesPanel } from "@/components/knowledge/QuestionKnowledgeNotesPanel";
import { ReviewQuestionDetail } from "@/components/quiz/ReviewQuestionDetail";
import { cn } from "@/lib/utils";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

function ReviewQuestionExplanation({ question }: { question: QuizQuestion }) {
  if (!question.explanation) return null;

  return (
    <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Explanation
      </p>
      <div className="mt-1.5 text-sm leading-5 text-zinc-700">
        <MarkdownContent>{question.explanation}</MarkdownContent>
      </div>
    </section>
  );
}

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
        <ReviewQuestionExplanation question={question} />
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
