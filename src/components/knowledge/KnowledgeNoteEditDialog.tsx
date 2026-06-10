import * as Dialog from "@radix-ui/react-dialog";
import { confirm } from "@tauri-apps/plugin-dialog";
import { Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KnowledgeDetailEditor } from "@/components/knowledge/KnowledgeDetailEditor";
import { KnowledgeDetailViewer } from "@/components/knowledge/KnowledgeDetailViewer";
import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import {
  clearKnowledgeDraft,
  formatTagsInput,
  isUnsavedKnowledgeDraft,
  parseTagsInput,
  resolveKnowledgeNoteSource,
  stashKnowledgeDraft,
  validateKnowledgeNote,
} from "@/lib/knowledgeDraft";
import { errorMessage } from "@/lib/native";
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
  const { items, createItem, saveItem, deleteItem } = useKnowledgeLibrary();
  const source = resolveKnowledgeNoteSource(item.id, items, item) ?? item;
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [draft, setDraft] = useState(source);
  const [tagsInput, setTagsInput] = useState(() => formatTagsInput(source.tags));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const nextSource = resolveKnowledgeNoteSource(item.id, items, item) ?? item;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form when dialog opens
    setMode(initialMode);
    setDraft(nextSource);
    setTagsInput(formatTagsInput(nextSource.tags));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit `items` so focus-triggered library refreshes do not wipe edits
  }, [open, initialMode, item.id, item]);
  const isNewDraft = isUnsavedKnowledgeDraft(draft);

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving || isDeleting) return;
    if (!nextOpen) {
      if (isUnsavedKnowledgeDraft(draft)) {
        clearKnowledgeDraft(draft.id);
      } else {
        setDraft(source);
        setTagsInput(formatTagsInput(source.tags));
      }
      setMode(initialMode);
    }
    onOpenChange(nextOpen);
  }

  function discardNewDraft() {
    clearKnowledgeDraft(draft.id);
    onOpenChange(false);
  }

  function handleCancelEdit() {
    if (isNewDraft) {
      discardNewDraft();
      return;
    }
    setDraft(source);
    setTagsInput(formatTagsInput(source.tags));
    setMode("view");
  }

  function updateDraft(patch: Partial<KnowledgeItem> & { tagsInput?: string }) {
    const { tagsInput: nextTagsInput, ...itemPatch } = patch;
    if (nextTagsInput !== undefined) {
      setTagsInput(nextTagsInput);
    }
    setDraft((current) => {
      const next = { ...current, ...itemPatch };
      if (isUnsavedKnowledgeDraft(next)) {
        stashKnowledgeDraft(next);
      }
      return next;
    });
  }

  async function handleSave() {
    const validationError = validateKnowledgeNote(draft);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: draft.title.trim(),
        content: draft.content.trim(),
        tags: parseTagsInput(tagsInput),
        linkedQuizQuestions: draft.linkedQuizQuestions,
      };

      if (isNewDraft) {
        const created = await createItem(payload);
        clearKnowledgeDraft(draft.id);
        setDraft(created);
        setTagsInput(formatTagsInput(created.tags));
        setMode("view");
        onSaved?.(created);
        toast.success("Knowledge note saved.");
        return;
      }

      const updated = { ...draft, ...payload };
      await saveItem(updated);
      setDraft(updated);
      setTagsInput(formatTagsInput(updated.tags));
      setMode("view");
      onSaved?.(updated);
      toast.success("Knowledge note saved.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (isNewDraft) {
      discardNewDraft();
      return;
    }

    const approved = await confirm(
      `Delete "${draft.title}"? This cannot be undone.`,
      { title: "Delete note?", kind: "warning" },
    );
    if (!approved) return;
    setIsDeleting(true);
    try {
      await deleteItem(draft.fileName);
      toast.success("Knowledge note deleted.");
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsDeleting(false);
    }
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
          <div className="shrink-0 border-b border-zinc-100 px-6 py-4">
            <Dialog.Title className="text-lg font-semibold text-zinc-950">
              {mode === "view" && !isNewDraft ? "Knowledge note" : "Edit knowledge note"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-zinc-500">
              {mode === "view" && !isNewDraft
                ? "Review the note and return to the question when you are done."
                : "Title and content are required. Tags are optional."}
            </Dialog.Description>
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

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
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
                contentRows={12}
                readOnlyLinkedQuestion={readOnlyLinkedQuestion}
                onChange={updateDraft}
              />
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-1 border-t border-zinc-100 px-6 py-4">
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
                  onClick={handleCancelEdit}
                  disabled={isSaving || isDeleting}
                />
                {!isNewDraft && (
                  <IconActionButton
                    icon={Trash2}
                    label="Delete"
                    onClick={() => void handleDelete()}
                    disabled={isDeleting || isSaving}
                  />
                )}
                <Button size="sm" onClick={() => void handleSave()} disabled={isSaving || isDeleting}>
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
