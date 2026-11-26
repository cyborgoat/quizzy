import { cn } from "@/lib/utils";
import {
  reviewQuestionCorrectClass,
  reviewQuestionFlaggedClass,
  reviewQuestionIncorrectClass,
} from "@/lib/reviewQuestionStatus";
import { useI18n } from "@/lib/i18n";

export function QuestionReviewIndexGrid({
  items,
  selectedIndex,
  onSelect,
}: {
  items: { id: string; isCorrect: boolean; flagged?: boolean }[];
  selectedIndex?: number;
  onSelect: (index: number) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex justify-center">
      <div
        className="inline-flex max-w-full flex-wrap justify-center gap-1"
        role="list"
        aria-label={t("review.indexAria")}
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="listitem"
            aria-label={t(item.flagged ? "review.indexItemFlagged" : "review.indexItem", {
              number: index + 1,
              result: t(item.isCorrect ? "review.resultCorrect" : "review.resultIncorrect"),
            })}
            className={cn(
              "grid-center size-7 shrink-0 rounded-md text-xs font-semibold tabular-nums transition-colors",
              item.isCorrect ? reviewQuestionCorrectClass : reviewQuestionIncorrectClass,
              item.flagged && reviewQuestionFlaggedClass,
              selectedIndex === index && "ring-2 ring-zinc-950 ring-offset-1",
            )}
            onClick={() => onSelect(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
