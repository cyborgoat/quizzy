import { MarkdownContent } from "@/components/quiz/MarkdownContent";
import { cn } from "@/lib/utils";

export function QuestionExplanation({
  explanation,
  compact = false,
  placeholder,
}: {
  explanation: string;
  compact?: boolean;
  placeholder?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-zinc-50", compact ? "p-3" : "p-4")}>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Explanation</p>
      <div
        className={cn(
          compact ? "mt-1.5 leading-5" : "mt-2 leading-6",
          placeholder ? "text-sm text-zinc-500" : "text-sm text-zinc-700",
        )}
      >
        {placeholder ? (
          <p>{placeholder}</p>
        ) : (
          <MarkdownContent>{explanation}</MarkdownContent>
        )}
      </div>
    </div>
  );
}
