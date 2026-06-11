import * as Dialog from "@radix-ui/react-dialog";
import { Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { KnowledgeDetailEditor } from "@/components/knowledge/KnowledgeDetailEditor";
import { KnowledgeDetailViewer } from "@/components/knowledge/KnowledgeDetailViewer";
import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useKnowledgeNoteEditor } from "@/hooks/useKnowledgeNoteEditor";
import {
  clearKnowledgeDraft,
  isUnsavedKnowledgeDraft,
  resolveKnowledgeNoteSource,
} from "@/lib/knowledgeDraft";
import { cn } from "@/lib/utils";
import type { KnowledgeItem, LinkedQuizQuestion } from "@/types/knowledge";

export function KnowledgeNoteEditDialog({
  item,
  open,
  onOpenChange,
  initialMode = "view",
  onSaved,
  readOnlyLinkedQuestion,
  stacked = false,
}: {
  item: KnowledgeItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "view" | "edit";
  onSaved?: (item: KnowledgeItem) => void;
  readOnlyLinkedQuestion?: LinkedQuizQuestion;
  stacked?: boolean;
}) {
  const library = useKnowledgeLibrary();
  const { items } = library;
  const source = resolveKnowledgeNoteSource(item.id, items, item) ?? item;

  const editor = useKnowledgeNoteEditor({
    ...library,
    source,
    initialMode,
    onCreated: onSaved,
    onUpdated: onSaved,
    onDeleted: () => onOpenChange(false),
    onDiscardNewDraft: () => onOpenChange(false),
  });

  const {
    mode,
    setMode,
    draft,
    tagsInput,
    isSaving,
    isDeleting,
    isNewDraft,
    resetFromSource,
    updateDraft,
    cancelEdit,
    save,
    deleteNote,
  } = editor;

  useEffect(() => {
    if (!open) return;
    const nextSource = resolveKnowledgeNoteSource(item.id, items, item) ?? item;
    resetFromSource(nextSource, initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when dialog opens, not on library refresh
  }, [open, initialMode, item.id, item]);

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving || isDeleting) return;
    if (!nextOpen) {
      if (isUnsavedKnowledgeDraft(draft)) {
        clearKnowledgeDraft(draft.id);
      } else {
        resetFromSource(source, initialMode);
      }
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn("fixed inset-0 bg-zinc-950/50", stacked ? "z-80" : "z-60")}
        />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-[min(100%,64rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl focus:outline-none",
            stacked ? "z-80" : "z-60",
          )}
        >
          <div className="shrink-0 border-b border-zinc-100 px-6 py-3">
            <Dialog.Title className="text-base font-semibold text-zinc-950">
              {mode === "view" && !isNewDraft ? "Knowledge note" : "Edit knowledge note"}
            </Dialog.Title>
            {mode === "view" && !isNewDraft ? (
              <Dialog.Description className="mt-0.5 text-sm text-zinc-500">
                Review the note and return to the question when you are done.
              </Dialog.Description>
            ) : null}
            <Dialog.Close asChild>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-4 top-4 text-zinc-900 hover:bg-zinc-100/60"
                aria-label="Close"
                disabled={isSaving || isDeleting}
              >
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div
            className={cn(
              "min-h-0 flex-1 px-6",
              mode === "view" && !isNewDraft
                ? "overflow-y-auto py-5"
                : "flex flex-col overflow-hidden py-4",
            )}
          >
            {mode === "view" && !isNewDraft ? (
              <KnowledgeDetailViewer
                item={draft}
                onEdit={() => setMode("edit")}
              />
            ) : (
              <KnowledgeDetailEditor
                item={draft}
                tagsInput={tagsInput}
                disabled={isSaving || isDeleting}
                fillHeight
                readOnlyLinkedQuestion={readOnlyLinkedQuestion}
                onChange={updateDraft}
              />
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-1 border-t border-zinc-100 px-6 py-3">
            {mode === "view" && !isNewDraft ? (
              <Dialog.Close asChild>
                <Button size="sm" variant="ghost" disabled={isSaving || isDeleting}>
                  Close
                </Button>
              </Dialog.Close>
            ) : (
              <>
                <IconActionButton
                  icon={X}
                  label="Cancel"
                  onClick={cancelEdit}
                  disabled={isSaving || isDeleting}
                />
                {!isNewDraft && (
                  <IconActionButton
                    icon={Trash2}
                    label="Delete"
                    onClick={() => void deleteNote()}
                    disabled={isDeleting || isSaving}
                  />
                )}
                <Button size="sm" onClick={() => void save()} disabled={isSaving || isDeleting}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
