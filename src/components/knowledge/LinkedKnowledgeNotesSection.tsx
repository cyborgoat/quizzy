import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { sectionLabelClassName } from "@/components/ui/section-label";
import { numberedListLinkClassName, NumberedListRow } from "@/components/ui/numbered-list-row";
import { cn } from "@/lib/utils";
import type { KnowledgeItem } from "@/types/knowledge";

export function LinkedKnowledgeNotesSection({
  notes,
  onSelectNote,
  onUnlinkNote,
  currentNoteId,
  headerActions,
  emptyDescription = "No linked references.",
  placeholder,
}: {
  notes: KnowledgeItem[];
  onSelectNote: (item: KnowledgeItem) => void;
  onUnlinkNote?: (item: KnowledgeItem) => void;
  currentNoteId?: string;
  headerActions?: ReactNode;
  emptyDescription?: string;
  placeholder?: string;
}) {
  return (
    <section className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={sectionLabelClassName}>
          References{!placeholder && notes.length > 0 ? ` (${notes.length})` : ""}
        </h2>
        {!placeholder && headerActions}
      </div>

      {placeholder ? (
        <p className="mt-1.5 text-xs leading-snug text-zinc-500">{placeholder}</p>
      ) : notes.length === 0 ? (
        <p className="mt-1.5 text-xs leading-snug text-zinc-500">{emptyDescription}</p>
      ) : (
        <ol className="mt-1.5 list-none space-y-1">
          {notes.map((item, index) => (
            <NumberedListRow key={item.id} index={index} className="group">
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelectNote(item)}
                  className={cn(
                    numberedListLinkClassName,
                    "min-w-0 flex-1",
                    item.id === currentNoteId && "font-medium text-zinc-950",
                  )}
                >
                  <span className="truncate">
                    {item.title}
                    {item.id === currentNoteId && (
                      <span className="font-normal text-zinc-500"> — this note</span>
                    )}
                  </span>
                </button>
                {onUnlinkNote && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onUnlinkNote(item);
                    }}
                    className="grid-center size-7 shrink-0 rounded-md text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-red-600 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 group-hover:opacity-100"
                    aria-label={`Unlink ${item.title}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </NumberedListRow>
          ))}
        </ol>
      )}
    </section>
  );
}
