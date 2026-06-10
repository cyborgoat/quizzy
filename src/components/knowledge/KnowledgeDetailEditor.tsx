import { LinkedQuestionPicker } from "@/components/knowledge/LinkedQuestionPicker";
import { LinkedQuestionReadOnlyField } from "@/components/knowledge/LinkedQuestionReadOnlyField";
import type { KnowledgeItem, LinkedQuizQuestion } from "@/types/knowledge";

const fieldClassName =
  "w-full max-w-full border-0 border-b border-zinc-200 bg-transparent px-0 shadow-none outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-0 disabled:opacity-50";

const sectionLabelClassName =
  "text-xs font-semibold uppercase tracking-wide text-zinc-500";

const contentFieldClassName =
  "knowledge-markdown-editor w-full max-w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-base leading-7 text-zinc-700 shadow-none outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-200/80 disabled:opacity-50";

export function KnowledgeDetailEditor({
  item,
  tagsInput,
  disabled = false,
  contentRows = 18,
  readOnlyLinkedQuestion,
  onChange,
}: {
  item: KnowledgeItem;
  tagsInput: string;
  disabled?: boolean;
  contentRows?: number;
  readOnlyLinkedQuestion?: LinkedQuizQuestion;
  onChange: (patch: Partial<KnowledgeItem> & { tagsInput?: string }) => void;
}) {
  return (
    <article className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden">
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
          className={`${fieldClassName} mt-2 text-2xl font-bold tracking-tight text-zinc-950 lg:text-3xl`}
        />
      </div>

      <div className="min-w-0">
        <label htmlFor="detail-tags" className={sectionLabelClassName}>
          Tags <span className="font-normal normal-case tracking-normal text-zinc-400">(optional)</span>
        </label>
        <input
          id="detail-tags"
          value={tagsInput}
          onChange={(event) => onChange({ tagsInput: event.target.value })}
          placeholder="e.g. react, hooks"
          disabled={disabled}
          className={`${fieldClassName} mt-2 text-sm text-zinc-950`}
        />
      </div>

      <div className="min-w-0">
        <p className={sectionLabelClassName}>Linked question</p>
        <div className="mt-2">
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

      <div className="min-w-0">
        <label htmlFor="detail-content" className={sectionLabelClassName}>
          Content
        </label>
        <textarea
          id="detail-content"
          value={item.content}
          onChange={(event) => onChange({ content: event.target.value })}
          rows={contentRows}
          disabled={disabled}
          placeholder="Write your notes in markdown..."
          className={`${contentFieldClassName} mt-2`}
        />
      </div>
    </article>
  );
}
