import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

function optionLabel(index: number) {
  return `${String.fromCharCode(65 + index)}.`;
}

export function AnswerOptionRow({
  index,
  text,
  selected,
  multiple,
  locked,
  isCorrectAnswer,
  isIncorrectSelection,
  onSelect,
}: {
  index: number;
  text: string;
  selected: boolean;
  multiple: boolean;
  locked: boolean;
  isCorrectAnswer: boolean;
  isIncorrectSelection: boolean;
  onSelect: () => void;
}) {
  const status = locked
    ? isCorrectAnswer
      ? "Correct answer"
      : isIncorrectSelection
        ? "Your answer · Incorrect"
        : selected
          ? "Your answer"
          : null
    : selected
      ? "Selected"
      : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-100",
        !locked && "hover:border-zinc-400 hover:bg-white",
        selected && !locked && "border-zinc-900 bg-white",
        !selected && !locked && "border-zinc-200 bg-zinc-50",
        locked && isCorrectAnswer && "border-emerald-400 bg-emerald-50",
        locked && isIncorrectSelection && "border-red-400 bg-red-50",
        locked && !isCorrectAnswer && !isIncorrectSelection && "border-zinc-200 bg-zinc-50",
      )}
    >
      <span className="flex h-5 shrink-0 items-center self-start">
        {multiple ? (
          <Checkbox checked={selected} disabled={locked} className="size-4" />
        ) : (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-4 items-center justify-center rounded-full border",
              selected ? "border-zinc-900" : "border-zinc-400",
            )}
          >
            {selected && <span className="size-2 rounded-full bg-zinc-900" />}
          </span>
        )}
      </span>
      <p className="min-w-0 flex-1 text-sm leading-5 text-zinc-900">
        <span className="mr-1.5 font-medium text-zinc-500">{optionLabel(index)}</span>
        {text}
      </p>
      {status && (
        <span className="shrink-0 rounded-full bg-white/80 px-2 py-1 text-xs font-semibold text-zinc-700">
          {status}
        </span>
      )}
    </button>
  );
}
