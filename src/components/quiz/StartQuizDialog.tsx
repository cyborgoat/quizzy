import { AlertTriangle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/ui/dialog";
import { groupQuestionsByType, QUESTION_TYPE_LABELS } from "@/lib/questionOrder";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/types/quiz";

export function StartQuizDialog({
  open,
  quiz,
  hasGoal,
  onOpenChange,
}: {
  open: boolean;
  quiz: Quiz;
  hasGoal: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const totalQuestions = quiz.questions.length;
  const groups = groupQuestionsByType(quiz.questions);

  return (
    <ConfirmDialog
      open={open}
      leading={<AlertTriangle className="size-8 text-amber-500" aria-hidden="true" />}
      title={`Start "${quiz.title}"?`}
      description={
        hasGoal
          ? "This is a scored attempt. You'll answer every question, and your result is saved to this quiz's goal once you submit."
          : "This is a scored attempt. You'll answer every question. Correct answers and explanations are shown only after you submit."
      }
      cancelLabel="Cancel"
      confirmLabel="Start quiz"
      onCancel={() => onOpenChange(false)}
      onConfirm={() => {
        onOpenChange(false);
        navigate({
          to: "/quiz/$quizId",
          params: { quizId: quiz.id },
          search: {},
        });
      }}
    >
      <dl className="mt-5 overflow-hidden rounded-lg border border-zinc-200 text-sm">
        {groups.map((group, index) => (
          <div
            key={group.type}
            className={cn(
              "flex items-center justify-between px-3 py-2.5",
              index > 0 && "border-t border-zinc-200",
            )}
          >
            <dt className="text-zinc-600">{QUESTION_TYPE_LABELS[group.type]}</dt>
            <dd className="font-semibold tabular-nums text-zinc-950">
              {group.questions.length}
            </dd>
          </div>
        ))}
        {groups.length > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-3 py-2.5">
            <dt className="font-medium text-zinc-700">Total questions</dt>
            <dd className="font-semibold tabular-nums text-zinc-950">
              {totalQuestions}
            </dd>
          </div>
        )}
      </dl>
      {!hasGoal && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          No goal is set for this quiz, so this attempt won&apos;t be recorded. Add
          a goal first to track your scores.
        </p>
      )}
    </ConfirmDialog>
  );
}
