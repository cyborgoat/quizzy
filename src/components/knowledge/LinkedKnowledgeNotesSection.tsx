import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { KnowledgeItem } from "@/types/knowledge";

export function LinkedKnowledgeNotesSection({
  notes,
  onSelectNote,
  currentNoteId,
  headerActions,
  emptyDescription = "No linked references.",
}: {
  notes: KnowledgeItem[];
  onSelectNote: (item: KnowledgeItem) => void;
  currentNoteId?: string;
  headerActions?: ReactNode;
  emptyDescription?: string;
}) {
  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          References{notes.length > 0 ? ` (${notes.length})` : ""}
        </h2>
        {headerActions}
      </div>

      {notes.length === 0 ? (
        <p className="mt-1.5 text-xs leading-snug text-zinc-500">{emptyDescription}</p>
      ) : (
        <ol className="mt-1.5 list-none space-y-1">
          {notes.map((item, index) => (
            <li key={item.id} className="flex gap-2 text-sm leading-snug">
              <span
                className="w-6 shrink-0 text-right font-mono text-[11px] tabular-nums text-zinc-400"
                aria-hidden
              >
                [{index + 1}]
              </span>
              <button
                type="button"
                onClick={() => onSelectNote(item)}
                className={cn(
                  "min-w-0 text-left text-zinc-800 transition-colors hover:text-zinc-950 hover:underline",
                  item.id === currentNoteId && "font-medium text-zinc-950",
                )}
              >
                {item.title}
                {item.id === currentNoteId && (
                  <span className="font-normal text-zinc-500"> — this note</span>
                )}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
