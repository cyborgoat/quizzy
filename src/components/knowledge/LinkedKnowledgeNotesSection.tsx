import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { KnowledgeItem } from "@/types/knowledge";

export function LinkedKnowledgeNotesSection({
  notes,
  onSelectNote,
  currentNoteId,
  title,
  headerActions,
  emptyDescription = "No knowledge notes linked to this question yet.",
  emptyActions,
}: {
  notes: KnowledgeItem[];
  onSelectNote: (item: KnowledgeItem) => void;
  currentNoteId?: string;
  title?: string;
  headerActions?: ReactNode;
  emptyDescription?: string;
  emptyActions?: ReactNode;
}) {
  const heading = title ?? `Knowledge notes (${notes.length})`;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-950">{heading}</h2>
        {headerActions}
      </div>

      {notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center">
          <p className="text-sm text-zinc-600">{emptyDescription}</p>
          {emptyActions && <div className="mt-3 flex justify-center">{emptyActions}</div>}
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
          {notes.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectNote(item)}
                className={cn(
                  "w-full px-3 py-2.5 text-left text-sm text-zinc-950 transition-colors hover:bg-zinc-50",
                  item.id === currentNoteId ? "font-semibold" : "font-medium",
                )}
              >
                {item.title}
                {item.id === currentNoteId && (
                  <span className="ml-2 text-xs font-normal text-zinc-500">(current note)</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
