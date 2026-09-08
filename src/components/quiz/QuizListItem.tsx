import { ArchiveRestore, Play, Settings } from "lucide-react";
import { knowledgeTagBadgeClassName } from "@/components/knowledge/knowledgeStyles";
import { QuizStatusBadge } from "@/components/quiz/QuizStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listItemTitleClassName } from "@/components/ui/typography";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import { useGoals } from "@/hooks/useGoals";
import { quizProgressMetrics, quizProgressStatus } from "@/lib/quizProgress";
import type { QuizSource } from "@/types/quiz";

const revealActionClassName =
  "size-8 pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100";

export function QuizListItem({
  source,
  onOpenDetails,
}: {
  source: QuizSource;
  onOpenDetails: (quizId: string) => void;
}) {
  const { goals } = useGoals();
  const { openQuizStart } = useQuizStartDialog();
  const goal = goals.find((item) => item.quizId === source.quiz.id);
  const status = quizProgressStatus(goal);
  const { attemptCount, highestScore } = quizProgressMetrics(goal);

  return (
    <article className="group flex min-h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-[border-color,box-shadow] hover:border-zinc-300 hover:shadow-sm focus-within:border-zinc-300 focus-within:shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <QuizStatusBadge status={source.archived ? "archived" : status} />
        <Button
          size="icon"
          variant="ghost"
          className={revealActionClassName}
          onClick={() => onOpenDetails(source.quiz.id)}
          aria-label={`Open details and settings for ${source.quiz.title}`}
          title="Details and settings"
        >
          <Settings className="size-4" />
        </Button>
      </div>

      <div className="mt-3">
        <h2 className={listItemTitleClassName}>{source.quiz.title}</h2>
        <p className="mt-0.5 truncate text-xs text-zinc-500" title={source.fileName}>
          {source.fileName}
        </p>
      </div>

      <p className="mt-3 line-clamp-3 flex-1 text-xs leading-5 text-zinc-600">
        {source.quiz.description ?? "No description provided."}
      </p>

      {source.quiz.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {source.quiz.tags.map((tag) => (
            <Badge key={tag} className={knowledgeTagBadgeClassName}>
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
        <span>{source.quiz.questions.length} questions</span>
        <span aria-hidden="true">·</span>
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
        <span aria-hidden="true">·</span>
        <span>Best {highestScore === undefined ? "—" : `${highestScore}%`}</span>
        {goal?.targetScore !== undefined && (
          <>
            <span aria-hidden="true">·</span>
            <span>Target {goal.targetScore}%</span>
          </>
        )}
      </div>

      <Button
        className="mt-3 w-full bg-zinc-900 hover:bg-zinc-800"
        disabled={source.archived}
        onClick={() => openQuizStart({ quizId: source.quiz.id })}
      >
        {source.archived ? (
          <ArchiveRestore className="size-4" />
        ) : (
          <Play className="size-4 fill-current" />
        )}
        {source.archived ? "Restore to start" : "Start quiz"}
      </Button>
    </article>
  );
}
