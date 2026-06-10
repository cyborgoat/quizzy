import { useMemo } from "react";
import { QuestionKnowledgeNotesPanel } from "@/components/knowledge/QuestionKnowledgeNotesPanel";
import { ReviewQuestionDetail } from "@/components/quiz/ReviewQuestionDetail";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatShortDate } from "@/lib/formatDate";
import { remapAnswerToFileQuestion } from "@/lib/quizReview";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

export function MistakeReviewDrawer({
  entry,
  question,
  questionIndex,
  open,
  onOpenChange,
}: {
  entry: MistakeEntry | null;
  question: QuizQuestion | null;
  questionIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const record: AnswerRecord | null = useMemo(() => {
    if (!entry) return null;
    return {
      questionId: entry.questionId,
      answer:
        question && entry.lastIncorrectAnswer
          ? remapAnswerToFileQuestion(
              question,
              entry.lastIncorrectAnswer,
              entry.lastIncorrectOptions,
            )
          : entry.lastIncorrectAnswer,
      isCorrect: entry.mistakeCount === 0,
      flagged: entry.flaggedCount > 0,
    };
  }, [entry, question]);

  if (!entry || !record) return null;
  const currentEntry = entry;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      shouldScaleBackground={false}
    >
      <DrawerContent className="flex h-full w-full max-w-xl min-w-0 flex-col overflow-x-hidden lg:max-w-2xl">
        <DrawerHeader className="shrink-0 border-b border-zinc-100">
          <DrawerTitle>Review mistake</DrawerTitle>
          <DrawerDescription>
            {currentEntry.quizTitle} · {currentEntry.mistakeCount} mistake
            {currentEntry.mistakeCount === 1 ? "" : "s"} · Last mistaken{" "}
            {formatShortDate(currentEntry.lastMistakenAt)} · {currentEntry.flaggedCount} flag
            {currentEntry.flaggedCount === 1 ? "" : "s"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-w-0 flex-1 overflow-x-clip overflow-y-auto p-4">
          {question ? (
            <ReviewQuestionDetail
              question={question}
              index={questionIndex}
              record={record}
            />
          ) : (
            <article className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm font-semibold text-zinc-950">{currentEntry.prompt}</p>
              <p className="mt-3 text-sm text-zinc-600">
                This question could not be loaded from the quiz file. It may have been removed or
                the quiz file is unavailable.
              </p>
            </article>
          )}

          <Separator className="my-5" />

          <QuestionKnowledgeNotesPanel
            quizId={currentEntry.quizId}
            questionId={currentEntry.questionId}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
