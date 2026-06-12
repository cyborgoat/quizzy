import type { ReactNode } from "react";
import { sectionLabelClassName } from "@/components/ui/section-label";
import { numberedListLinkClassName, NumberedListRow } from "@/components/ui/numbered-list-row";
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
        <h2 className={sectionLabelClassName}>
          References{notes.length > 0 ? ` (${notes.length})` : ""}
        </h2>
        {headerActions}
      </div>

      {notes.length === 0 ? (
        <p className="mt-1.5 text-xs leading-snug text-zinc-500">{emptyDescription}</p>
      ) : (
        <ol className="mt-1.5 list-none space-y-1">
          {notes.map((item, index) => (
            <NumberedListRow key={item.id} index={index}>
              <button
                type="button"
                onClick={() => onSelectNote(item)}
                className={cn(
                  numberedListLinkClassName,
                  item.id === currentNoteId && "font-medium text-zinc-950",
                )}
              >
                {item.title}
                {item.id === currentNoteId && (
                  <span className="font-normal text-zinc-500"> — this note</span>
                )}
              </button>
            </NumberedListRow>
          ))}
        </ol>
      )}
    </section>
  );
}
