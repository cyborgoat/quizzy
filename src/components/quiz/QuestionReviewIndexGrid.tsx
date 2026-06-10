import { cn } from "@/lib/utils";

export function QuestionReviewIndexGrid({
  items,
  selectedIndex,
  onSelect,
}: {
  items: { id: string; isCorrect: boolean; flagged?: boolean }[];
  selectedIndex?: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex justify-center">
      <div
        className="inline-flex max-w-full flex-wrap justify-center gap-1"
        role="list"
        aria-label="Question index"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="listitem"
            aria-label={`Question ${index + 1}, ${item.isCorrect ? "correct" : "incorrect"}${item.flagged ? ", flagged" : ""}`}
            className={cn(
              "grid-center size-7 shrink-0 rounded-md text-xs font-semibold tabular-nums transition-colors",
              item.isCorrect
                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                : "bg-red-100 text-red-800 hover:bg-red-200",
              item.flagged && "ring-2 ring-amber-400 ring-offset-1",
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
