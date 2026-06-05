import { ArrowRight, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
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
    <article className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">{source.quiz.title}</h2>
          <p className="mt-1 text-xs text-zinc-500">{source.fileName}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-9 text-zinc-500 hover:text-red-700"
          onClick={onDelete}
          aria-label={`Delete ${source.quiz.title}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <p className="mt-4 flex-1 text-sm leading-6 text-zinc-600">
        {source.quiz.description ?? "No description provided."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {source.quiz.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
        <span className="text-sm text-zinc-500">
          {source.quiz.questions.length} questions
        </span>
        <Link
          className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          to={`/quiz/${source.quiz.id}`}
        >
          Start quiz <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
