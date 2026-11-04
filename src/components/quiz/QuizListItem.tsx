import { ArchiveRestore, FileText, Play, Star } from "lucide-react";
import { useState } from "react";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { knowledgeTagBadgeClassName } from "@/components/knowledge/knowledgeStyles";
import { QuizStatusIcon } from "@/components/quiz/QuizStatusIcon";
import { CardShine } from "@/components/ui/card-shine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listItemTitleClassName } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import { useGoals } from "@/hooks/useGoals";
import { quizProgressMetrics, quizProgressStatus } from "@/lib/quizProgress";
import type { QuizSource } from "@/types/quiz";

const revealClassName =
  "pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100";

const revealActionClassName = `size-8 ${revealClassName}`;

export function QuizListItem({
  source,
  onOpenDetails,
}: {
  source: QuizSource;
  onOpenDetails: (quizId: string) => void;
}) {
  const { goals } = useGoals();
  const { favoriteQuizIds, setQuizFavorite } = useQuizLibrary();
  const favorite = favoriteQuizIds.has(source.quiz.id);
  const [savingFavorite, setSavingFavorite] = useState(false);

  async function toggleFavorite() {
    setSavingFavorite(true);
    try {
      await setQuizFavorite(source.quiz.id, !favorite);
    } finally {
      setSavingFavorite(false);
    }
  }
  const { openQuizStart } = useQuizStartDialog();
  const goal = goals.find((item) => item.quizId === source.quiz.id);
  const status = quizProgressStatus(goal);
  const { attemptCount, highestScore } = quizProgressMetrics(goal);

  return (
    <article className="group relative flex h-36 flex-col gap-2 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 px-3 pb-2 pt-2.5 shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md focus-within:border-zinc-300 focus-within:shadow-md">
      <CardShine />
      <div className="flex items-start gap-2">
        <span className="mt-px shrink-0">
          <QuizStatusIcon status={source.archived ? "archived" : status} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className={cn(listItemTitleClassName, "truncate leading-6")} title={source.quiz.title}>{source.quiz.title}</h2>
          <p className="truncate text-xs text-zinc-500" title={source.fileName}>
            {source.fileName}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className={cn(revealActionClassName, "size-6 shrink-0")}
          onClick={() => onOpenDetails(source.quiz.id)}
          aria-label={`Open details for ${source.quiz.title}`}
          title="Details"
        >
          <FileText className="size-4" />
        </Button>
        <IconActionButton
          icon={Star}
          label={favorite ? `Unfavorite ${source.quiz.title}` : `Favorite ${source.quiz.title}`}
          aria-pressed={favorite}
          disabled={savingFavorite}
          className={cn("size-6 shrink-0 text-zinc-400", favorite && "text-amber-500 hover:text-amber-600")}
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

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-100 pt-1.5">
        <div
          className="min-w-0 flex-1 truncate text-xs text-zinc-600"
          title={[
            `${source.quiz.questions.length} questions`,
            `${attemptCount} ${attemptCount === 1 ? "attempt" : "attempts"}`,
            `Best ${highestScore === undefined ? "—" : `${highestScore}%`}`,
            ...(goal?.targetScore !== undefined ? [`Target ${goal.targetScore}%`] : []),
          ].join(" · ")}
        >
          <span>{source.quiz.questions.length} questions</span>
          <span aria-hidden="true" className="mx-1">·</span>
          {goal ? (
            <button
              type="button"
              className="font-medium text-zinc-700 hover:text-zinc-950 hover:underline"
              onClick={() => onOpenDetails(source.quiz.id)}
            >
              {attemptCount} {attemptCount === 1 ? "attempt" : "attempts"}
            </button>
          ) : (
            <span>0 attempts</span>
          )}
          <span aria-hidden="true" className="mx-1">·</span>
          <span>Best {highestScore === undefined ? "—" : `${highestScore}%`}</span>
          {goal?.targetScore !== undefined && (
            <>
              <span aria-hidden="true" className="mx-1">·</span>
              <span>Target {goal.targetScore}%</span>
            </>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-7 shrink-0 text-zinc-700 hover:bg-zinc-900 hover:text-white",
            revealClassName,
            "transition-[opacity,color,background-color] duration-300 ease-in-out",
          )}
          disabled={source.archived}
          onClick={() => openQuizStart({ quizId: source.quiz.id })}
        >
          {source.archived ? (
            <ArchiveRestore className="size-3.5" />
          ) : (
            <Play className="size-3.5 fill-current" />
          )}
          {source.archived ? "Restore to start" : "Start quiz"}
        </Button>
      </div>
    </article>
  );
}
