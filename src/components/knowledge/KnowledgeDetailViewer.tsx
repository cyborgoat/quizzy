import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KnowledgeProse } from "@/components/knowledge/KnowledgeProse";
import { LinkedQuestionList } from "@/components/knowledge/LinkedQuestionList";
import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { formatShortDate } from "@/lib/formatDate";
import type { KnowledgeItem } from "@/types/knowledge";

export function KnowledgeDetailViewer({
  item,
  onAddContent,
}: {
  item: KnowledgeItem;
  onAddContent: () => void;
}) {
  const hasContent = item.content.trim().length > 0;

  return (
    <article className="w-full min-w-0 max-w-full overflow-x-clip">
      <header className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 lg:text-3xl">
          {item.title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Updated {formatShortDate(item.updatedAt)}
        </p>
      </header>

      {item.tags.length > 0 && (
        <div className="mt-4 flex min-w-0 flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}

      {item.linkedQuizQuestions.length > 0 && (
        <section className="mt-6 min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Linked questions
          </h2>
          <div className="mt-2">
            <LinkedQuestionList links={item.linkedQuizQuestions} />
          </div>
        </section>
      )}

      <section className="mt-8 min-w-0">
        {hasContent ? (
          <KnowledgeProse>
            <MarkdownContent variant="prose">{item.content}</MarkdownContent>
          </KnowledgeProse>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-zinc-500">No content yet.</p>
            <Button className="mt-3" size="sm" variant="outline" onClick={onAddContent}>
              Add content
            </Button>
          </div>
        )}
      </section>
    </article>
  );
}
