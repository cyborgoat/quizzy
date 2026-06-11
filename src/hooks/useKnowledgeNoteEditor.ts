import { confirm } from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { toast } from "sonner";
import {
  clearKnowledgeDraft,
  formatTagsInput,
  isUnsavedKnowledgeDraft,
  parseTagsInput,
  stashKnowledgeDraft,
  validateKnowledgeNote,
} from "@/lib/knowledgeDraft";
import { errorMessage } from "@/lib/native";
import type { KnowledgeItem } from "@/types/knowledge";

type KnowledgeLibraryActions = {
  items: KnowledgeItem[];
  createItem: (payload: {
    title: string;
    content: string;
    tags: string[];
    linkedQuizQuestions: KnowledgeItem["linkedQuizQuestions"];
  }) => Promise<KnowledgeItem>;
  saveItem: (item: KnowledgeItem) => Promise<void>;
  deleteItem: (fileName: string) => Promise<void>;
};

type UseKnowledgeNoteEditorOptions = KnowledgeLibraryActions & {
  source: KnowledgeItem;
  initialMode?: "view" | "edit";
  onCreated?: (item: KnowledgeItem) => void;
  onUpdated?: (item: KnowledgeItem) => void;
  onDeleted?: () => void;
  onDiscardNewDraft?: () => void;
};

export function useKnowledgeNoteEditor({
  source,
  items,
  createItem,
  saveItem,
  deleteItem,
  initialMode = "view",
  onCreated,
  onUpdated,
  onDeleted,
  onDiscardNewDraft,
}: UseKnowledgeNoteEditorOptions) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [draft, setDraft] = useState(source);
  const [tagsInput, setTagsInput] = useState(() => formatTagsInput(source.tags));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isNewDraft = isUnsavedKnowledgeDraft(draft);

  function resetFromSource(nextSource: KnowledgeItem, nextMode?: "view" | "edit") {
    setDraft(nextSource);
    setTagsInput(formatTagsInput(nextSource.tags));
    if (nextMode !== undefined) {
      setMode(nextMode);
    }
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

  function cancelEdit() {
    if (isNewDraft) {
      clearKnowledgeDraft(draft.id);
      onDiscardNewDraft?.();
      return;
    }

    const persisted = items.find((entry) => entry.id === draft.id);
    resetFromSource(persisted ?? source, "view");
  }

  async function save() {
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
        resetFromSource(created, "view");
        onCreated?.(created);
        toast.success("Knowledge note saved.");
        return;
      }

      const updated = { ...draft, ...payload };
      await saveItem(updated);
      resetFromSource(updated, "view");
      onUpdated?.(updated);
      toast.success("Knowledge note saved.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteNote() {
    if (isNewDraft) {
      clearKnowledgeDraft(draft.id);
      onDiscardNewDraft?.();
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
      onDeleted?.();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return {
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
  };
}
