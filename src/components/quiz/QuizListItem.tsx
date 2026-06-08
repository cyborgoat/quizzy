import { ArrowRight, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { QuizSource } from "@/types/quiz";

export function QuizListItem({
  source,
  onDelete,
}: {
  source: QuizSource;
  onDelete: () => void;
}) {
  return (
    <article className="group flex flex-col rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">{source.quiz.title}</h2>
          <p className="mt-0.5 text-xs text-zinc-500">{source.fileName}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-zinc-500 hover:text-red-700"
          onClick={onDelete}
          aria-label={`Delete ${source.quiz.title}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <p className="mt-3 flex-1 text-xs leading-5 text-zinc-600">
        {source.quiz.description ?? "No description provided."}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {source.quiz.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
        <span className="text-xs text-zinc-500">
          {source.quiz.questions.length} questions
        </span>
        <Link
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          to="/quiz/$quizId"
          params={{ quizId: source.quiz.id }}
          search={{ from: "home" }}
        >
          Start quiz <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
