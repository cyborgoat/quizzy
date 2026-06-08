import { cn } from "@/lib/utils";

export function QuestionReviewIndexGrid({
  items,
  onSelect,
}: {
  items: { id: string; isCorrect: boolean }[];
  onSelect: (index: number) => void;
}) {
  return (
    <div
      className="grid grid-cols-8 gap-1.5 sm:grid-cols-10"
      role="list"
      aria-label="Question index"
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          role="listitem"
          aria-label={`Question ${index + 1}, ${item.isCorrect ? "correct" : "incorrect"}`}
          className={cn(
            "grid-center size-8 rounded-md text-xs font-semibold tabular-nums transition-colors",
            item.isCorrect
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              : "bg-red-100 text-red-800 hover:bg-red-200",
          )}
          onClick={() => onSelect(index)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}
