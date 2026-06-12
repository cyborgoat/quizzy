import * as Dialog from "@radix-ui/react-dialog";
import { Trash2, X } from "lucide-react";
import { useEffect } from "react";
import {
  ResizableDialogShell,
  type DialogStackLayer,
} from "@/components/ui/resizable-dialog-shell";
import { KnowledgeDetailEditor } from "@/components/knowledge/KnowledgeDetailEditor";
import { KnowledgeDetailViewer } from "@/components/knowledge/KnowledgeDetailViewer";
import { knowledgeDialogCloseButtonClassName } from "@/components/knowledge/knowledgeStyles";
import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useKnowledgeNoteEditor } from "@/hooks/useKnowledgeNoteEditor";
import {
  clearKnowledgeDraft,
  isUnsavedKnowledgeDraft,
  resolveKnowledgeNoteSource,
} from "@/lib/knowledgeDraft";
import type { KnowledgeItem, LinkedQuizQuestion } from "@/types/knowledge";

export function KnowledgeNoteEditDialog({
  item,
  open,
  onOpenChange,
  initialMode = "view",
  onSaved,
  readOnlyLinkedQuestion,
  layer = "default",
}: {
  item: KnowledgeItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "view" | "edit";
  onSaved?: (item: KnowledgeItem) => void;
  readOnlyLinkedQuestion?: LinkedQuizQuestion;
  layer?: DialogStackLayer;
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

  const isViewMode = mode === "view" && !isNewDraft;

  return (
    <ResizableDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      layer={layer}
      resizeDisabled={isSaving || isDeleting}
      title={isViewMode ? "Knowledge note" : "Edit knowledge note"}
      description={
        isViewMode
          ? "Review the note and return to the question when you are done."
          : undefined
      }
      bodyClassName={
        isViewMode ? undefined : "flex flex-col overflow-hidden py-4"
      }
      footer={
        isViewMode ? (
          <Dialog.Close asChild>
            <Button
              size="sm"
              variant="ghost"
              className={knowledgeDialogCloseButtonClassName}
              disabled={isSaving || isDeleting}
            >
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
        )
      }
    >
      {isViewMode ? (
        <KnowledgeDetailViewer
          item={draft}
          onEdit={() => setMode("edit")}
          stackedLinkedQuestionPreview
          recordView
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
    </ResizableDialogShell>
  );
}
