import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { sectionLabelClassName } from "@/components/ui/section-label";
import { useI18n } from "@/lib/i18n";

export function QuestionExplanation({
  explanation,
  placeholder,
}: {
  explanation: string;
  placeholder?: string;
}) {
  const { t } = useI18n();

  return (
    <section className="min-w-0">
      <h2 className={sectionLabelClassName}>{t("quiz.explanation")}</h2>
      {placeholder ? (
        <p className="mt-1.5 text-xs leading-snug text-zinc-500">{placeholder}</p>
      ) : (
        <div className="mt-1.5 text-sm text-zinc-700">
          <MarkdownContent>{explanation}</MarkdownContent>
        </div>
      )}
    </section>
  );
}
