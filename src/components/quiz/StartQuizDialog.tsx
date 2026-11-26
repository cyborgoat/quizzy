import { BookOpen } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { ConfirmDialog } from "@/components/ui/dialog";
import { groupQuestionsByType, QUESTION_TYPE_LABEL_KEYS } from "@/lib/questionOrder";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/types/quiz";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

  const navigate = useNavigate();
  const totalQuestions = quiz.questions.length;
  const groups = groupQuestionsByType(quiz.questions);

  return (
    <ConfirmDialog
      open={open}
      leading={<BookOpen className="size-8 text-zinc-700" aria-hidden="true" />}
      title={t("start.title", { title: quiz.title })}
      description={t(totalQuestions === 1 ? "start.descriptionOne" : "start.descriptionMany", {
        count: totalQuestions,
      })}
      cancelLabel={t("common.cancel")}
      confirmLabel={t("details.start")}
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
            <dt className="text-zinc-600">{t(QUESTION_TYPE_LABEL_KEYS[group.type])}</dt>
            <dd className="font-semibold tabular-nums text-zinc-950">
              {group.questions.length}
            </dd>
          </div>
        ))}
        {groups.length > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-3 py-2.5">
            <dt className="font-medium text-zinc-700">{t("start.totalQuestions")}</dt>
            <dd className="font-semibold tabular-nums text-zinc-950">
              {totalQuestions}
            </dd>
          </div>
        )}
      </dl>
      {!hasGoal && (
        <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
          {t("start.noGoalNote")}
        </p>
      )}
    </ConfirmDialog>
  );
}
