import { useState } from "react";
import type { KnowledgeItem } from "@/types/knowledge";

export function useKnowledgeNoteDialog() {
  const [activeNote, setActiveNote] = useState<KnowledgeItem | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteDialogMode, setNoteDialogMode] = useState<"view" | "edit">("view");

  function openNote(item: KnowledgeItem, mode: "view" | "edit" = "view") {
    setActiveNote(item);
    setNoteDialogMode(mode);
    setNoteDialogOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    setNoteDialogOpen(nextOpen);
    if (!nextOpen) {
      setActiveNote(null);
    }
  }

  function handleSaved(saved: KnowledgeItem) {
    setActiveNote(saved);
    setNoteDialogMode("view");
  }

  return {
    activeNote,
    noteDialogOpen,
    noteDialogMode,
    openNote,
    handleOpenChange,
    handleSaved,
  };
}
