import { LinkedQuestionPicker } from "@/components/knowledge/LinkedQuestionPicker";
import { LinkedQuestionReadOnlyField } from "@/components/knowledge/LinkedQuestionReadOnlyField";
import { KnowledgeMarkdownEditorLazy } from "@/components/knowledge/KnowledgeMarkdownEditor";
import { cn } from "@/lib/utils";
import type { KnowledgeItem, LinkedQuizQuestion } from "@/types/knowledge";

const fieldClassName =
  "w-full max-w-full border-0 border-b border-zinc-200 bg-transparent px-0 shadow-none outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-0 disabled:opacity-50";

const sectionLabelClassName =
  "text-xs font-semibold uppercase tracking-wide text-zinc-500";

export function KnowledgeDetailEditor({
  item,
  tagsInput,
  disabled = false,
  fillHeight = false,
  readOnlyLinkedQuestion,
  onChange,
}: {
  item: KnowledgeItem;
  tagsInput: string;
  disabled?: boolean;
  fillHeight?: boolean;
  readOnlyLinkedQuestion?: LinkedQuizQuestion;
  onChange: (patch: Partial<KnowledgeItem> & { tagsInput?: string }) => void;
}) {
  return (
    <article
      className={cn(
        "w-full min-w-0 max-w-full overflow-x-hidden",
        fillHeight ? "flex min-h-0 flex-1 flex-col gap-3" : "space-y-3",
      )}
    >
      <div className="grid min-w-0 shrink-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor="detail-title" className={sectionLabelClassName}>
            Title
          </label>
          <input
            id="detail-title"
            value={item.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="Enter a title"
            disabled={disabled}
            className={`${fieldClassName} mt-1 text-lg font-semibold tracking-tight text-zinc-950`}
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="detail-tags" className={sectionLabelClassName}>
            Tags{" "}
            <span className="font-normal normal-case tracking-normal text-zinc-400">
              (optional)
            </span>
          </label>
          <input
            id="detail-tags"
            value={tagsInput}
            onChange={(event) => onChange({ tagsInput: event.target.value })}
            placeholder="e.g. react, hooks"
            disabled={disabled}
            className={`${fieldClassName} mt-1 text-sm text-zinc-950`}
          />
        </div>
      </div>

      <div className="min-w-0 shrink-0">
        <p className={sectionLabelClassName}>Linked question</p>
        <div className="mt-1">
          {readOnlyLinkedQuestion ? (
            <LinkedQuestionReadOnlyField link={readOnlyLinkedQuestion} />
          ) : (
            <LinkedQuestionPicker
              value={item.linkedQuizQuestions}
              onChange={(linkedQuizQuestions) => onChange({ linkedQuizQuestions })}
              disabled={disabled}
            />
          )}
        </div>
      </div>

      <div
        className={cn("min-w-0", fillHeight && "flex min-h-0 flex-1 flex-col")}
        aria-labelledby="detail-content-label"
      >
        <p id="detail-content-label" className={cn(sectionLabelClassName, "shrink-0")}>
          Content
        </p>
        <KnowledgeMarkdownEditorLazy
          value={item.content}
          onChange={(content) => onChange({ content })}
          disabled={disabled}
          fillHeight={fillHeight}
        />
      </div>
    </article>
  );
}
