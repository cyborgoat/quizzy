import { LinkedQuestionPicker } from "@/components/knowledge/LinkedQuestionPicker";
import { KnowledgeTagsInput } from "@/components/knowledge/KnowledgeTagsInput";
import { LinkedQuestionReadOnlyField } from "@/components/knowledge/LinkedQuestionReadOnlyField";
import { KnowledgeMarkdownEditorLazy } from "@/components/knowledge/KnowledgeMarkdownEditor";
import { sectionLabelClassName } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";
import type { KnowledgeItem, LinkedQuizQuestion } from "@/types/knowledge";
import { useI18n } from "@/lib/i18n";

const fieldClassName =
  "w-full max-w-full border-0 border-b border-zinc-200 bg-transparent px-0 shadow-none outline-none transition-colors placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-0 disabled:opacity-50";

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
  const { t } = useI18n();

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
            {t("knowledge.field.title")}
          </label>
          <input
            id="detail-title"
            value={item.title}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder={t("knowledge.field.titlePlaceholder")}
            disabled={disabled}
            className={`${fieldClassName} mt-1 text-lg font-semibold tracking-tight text-zinc-950`}
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="detail-tags" className={sectionLabelClassName}>
            {t("knowledge.field.tags")}{" "}
            <span className="font-normal normal-case tracking-normal text-zinc-400">
              {t("knowledge.field.optional")}
            </span>
          </label>
          <KnowledgeTagsInput
            id="detail-tags"
            value={tagsInput}
            onChange={(tagsInput) => onChange({ tagsInput })}
            disabled={disabled}
            className={`${fieldClassName} mt-1 text-sm text-zinc-950`}
          />
        </div>
      </div>

      <div className="min-w-0 shrink-0">
        <p className={sectionLabelClassName}>{t("knowledge.field.linkedQuestion")}</p>
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
          {t("knowledge.field.content")}
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
