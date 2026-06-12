import { Copy, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { KnowledgeProse } from "@/components/knowledge/KnowledgeProse";
import { LinkedQuestionList } from "@/components/knowledge/LinkedQuestionList";
import {
  knowledgeTagBadgeClassName,
} from "@/components/knowledge/knowledgeStyles";
import { sectionLabelClassName } from "@/components/ui/section-label";
import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { KNOWLEDGE_BASE_FOLDER } from "@/contexts/knowledge-library-context";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useRecordKnowledgeView } from "@/hooks/useRecordKnowledgeView";
import { copyTextToClipboard } from "@/lib/clipboard";
import { serializeKnowledgeFile } from "@/lib/frontMatter";
import { formatShortDate } from "@/lib/formatDate";
import { formatViewCount } from "@/lib/formatViewCount";
import { errorMessage } from "@/lib/native";
import type { KnowledgeItem } from "@/types/knowledge";

export function KnowledgeDetailViewer({
  item,
  onEdit,
  stackedLinkedQuestionPreview = false,
  recordView = false,
}: {
  item: KnowledgeItem;
  onEdit?: () => void;
  stackedLinkedQuestionPreview?: boolean;
  recordView?: boolean;
}) {
  const { items } = useKnowledgeLibrary();
  const liveItem = items.find((entry) => entry.id === item.id) ?? item;
  const hasContent = item.content.trim().length > 0;
  const [isCopying, setIsCopying] = useState(false);
  useRecordKnowledgeView(liveItem, recordView);
  const fileLocation = item.fileName
    ? `${KNOWLEDGE_BASE_FOLDER}/${item.fileName}`
    : null;

  async function handleCopyMarkdown() {
    setIsCopying(true);
    try {
      await copyTextToClipboard(serializeKnowledgeFile(item, item.content));
      toast.success("Markdown copied to clipboard.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsCopying(false);
    }
  }

  return (
    <article className="w-full min-w-0 max-w-full overflow-x-clip">
      <div className="flex items-start justify-between gap-3">
        <header className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 lg:text-3xl">
            {item.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Updated {formatShortDate(item.updatedAt)}
            {" · "}
            {formatViewCount(liveItem.views)}
            {fileLocation && (
              <>
                {" "}
                ·{" "}
                <span className="font-mono text-xs text-zinc-400" title={fileLocation}>
                  {fileLocation}
                </span>
              </>
            )}
          </p>
        </header>

        {(onEdit || hasContent) && (
          <div className="flex shrink-0 items-center gap-1">
            {hasContent && (
              <IconActionButton
                icon={Copy}
                label="Copy"
                onClick={() => void handleCopyMarkdown()}
                disabled={isCopying}
              />
            )}
            {onEdit && (
              <IconActionButton icon={Pencil} label="Edit" onClick={onEdit} />
            )}
          </div>
        )}
      </div>

      {item.tags.length > 0 && (
        <div className="mt-3 flex min-w-0 flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge key={tag} className={knowledgeTagBadgeClassName}>
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {item.linkedQuizQuestions.length > 0 && (
        <section className="mt-5 min-w-0">
          <h2 className={sectionLabelClassName}>Linked questions</h2>
          <div className="mt-1.5">
            <LinkedQuestionList
              links={item.linkedQuizQuestions}
              currentNoteId={item.id}
              previewLayer={stackedLinkedQuestionPreview ? "stacked" : "default"}
            />
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
          </div>
        )}
      </section>
    </article>
  );
}
