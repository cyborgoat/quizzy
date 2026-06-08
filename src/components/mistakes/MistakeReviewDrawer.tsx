import { ReviewQuestionDetail } from "@/components/quiz/ReviewQuestionDetail";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatMistakeDate } from "@/lib/mistakeLog";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

export function MistakeReviewDrawer({
  entry,
  question,
  open,
  onOpenChange,
}: {
  entry: MistakeEntry | null;
  question: QuizQuestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!entry) return null;

  const record: AnswerRecord = {
    questionId: entry.questionId,
    answer: entry.lastIncorrectAnswer,
    isCorrect: false,
    flagged: false,
  };

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      shouldScaleBackground={false}
    >
      <DrawerContent className="flex h-full max-w-xl flex-col lg:max-w-2xl">
        <DrawerHeader className="shrink-0 border-b border-zinc-100">
          <DrawerTitle>Review mistake</DrawerTitle>
          <DrawerDescription>
            {entry.quizTitle} · {entry.mistakeCount} mistake
            {entry.mistakeCount === 1 ? "" : "s"} · Last mistaken{" "}
            {formatMistakeDate(entry.lastMistakenAt)}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {question ? (
            <ReviewQuestionDetail question={question} index={0} record={record} />
          ) : (
            <article className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm font-semibold text-zinc-950">{entry.prompt}</p>
              <p className="mt-3 text-sm text-zinc-600">
                This question could not be loaded from the quiz file. It may have been removed or
                the quiz file is unavailable.
              </p>
            </article>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
