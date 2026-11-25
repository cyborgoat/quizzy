import { Star } from "lucide-react";
import { useState } from "react";
import { knowledgeTagBadgeClassName } from "@/components/knowledge/knowledgeStyles";
import { QuizStatusIcon } from "@/components/quiz/QuizStatusIcon";
import { QuizhubBadge } from "@/components/quizhub/QuizhubBadge";
import { Badge } from "@/components/ui/badge";
import { CardShine } from "@/components/ui/card-shine";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { listItemTitleClassName } from "@/components/ui/typography";
import { useQuizhubInstalledFiles } from "@/contexts/quizhub-installed-context";
import { useGoals } from "@/hooks/useGoals";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { quizProgressMetrics, quizProgressStatus } from "@/lib/quizProgress";
import { cn } from "@/lib/utils";
import type { QuizSource } from "@/types/quiz";

export function QuizListItem({
  source,
  onOpenDetails,
}: {
  source: QuizSource;
  onOpenDetails: (quizId: string, trigger: HTMLButtonElement) => void;
}) {
  const { goals } = useGoals();
  const { favoriteQuizIds, setQuizFavorite } = useQuizLibrary();
  const favorite = favoriteQuizIds.has(source.quiz.id);
  const fromQuizhub = useQuizhubInstalledFiles().quizzes.has(source.fileName);
  const [savingFavorite, setSavingFavorite] = useState(false);

  async function toggleFavorite() {
    setSavingFavorite(true);
    try {
      await setQuizFavorite(source.quiz.id, !favorite);
    } finally {
      setSavingFavorite(false);
    }
  }

  const goal = goals.find((item) => item.quizId === source.quiz.id);
  const status = source.archived ? "archived" : quizProgressStatus(goal);
  const { attemptCount, highestScore } = quizProgressMetrics(goal);
  const attemptSummary = `${attemptCount} ${attemptCount === 1 ? "attempt" : "attempts"}`;

  return (
    <article className="group relative flex h-36 flex-col gap-2 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 px-3 pb-2 pt-2.5 shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-within:border-zinc-300 focus-within:shadow-md">
      <CardShine />
      <button
        type="button"
        aria-label={`Open details for ${source.quiz.title}`}
        aria-haspopup="dialog"
        className="absolute inset-0 z-10 cursor-pointer rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-500"
        onClick={(event) => onOpenDetails(source.quiz.id, event.currentTarget)}
      />
      <div className="flex items-start gap-2">
        <span className="mt-px shrink-0">
          <QuizStatusIcon status={status} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className={cn(listItemTitleClassName, "truncate leading-6")} title={source.quiz.title}>
            {source.quiz.title}
          </h2>
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-zinc-500" title={source.fileName}>
            <span className="truncate">{source.fileName}</span>
            {fromQuizhub && <QuizhubBadge />}
          </p>
        </div>
        <IconActionButton
          icon={Star}
          label={favorite ? `Unfavorite ${source.quiz.title}` : `Favorite ${source.quiz.title}`}
          aria-pressed={favorite}
          disabled={savingFavorite}
          className={cn("relative z-20 size-6 shrink-0 text-zinc-400", favorite && "text-amber-500 hover:text-amber-600")}
          onClick={() => void toggleFavorite()}
        >
          <Star className={cn("size-4", favorite && "fill-current")} />
        </IconActionButton>
      </div>

      {source.quiz.tags.length > 0 && (
        <div className="flex flex-nowrap gap-1 overflow-hidden" title={source.quiz.tags.join(", ")}>
          {source.quiz.tags.map((tag) => (
            <Badge key={tag} title={tag} className={cn(knowledgeTagBadgeClassName, "min-w-0 shrink text-xs")}>
              <span className="truncate">{tag}</span>
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto truncate border-t border-zinc-100 pt-1.5 text-xs text-zinc-600">
        <span>{source.quiz.questions.length} questions</span>
        <span aria-hidden="true" className="mx-1">·</span>
        <span className={goal ? "font-medium text-zinc-700" : undefined}>{attemptSummary}</span>
        <span aria-hidden="true" className="mx-1">·</span>
        <span>Best {highestScore === undefined ? "—" : `${highestScore}%`}</span>
        {goal?.targetScore !== undefined && (
          <>
            <span aria-hidden="true" className="mx-1">·</span>
            <span>Target {goal.targetScore}%</span>
          </>
        )}
      </div>
    </article>
  );
}
