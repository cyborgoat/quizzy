import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { DialogStackLayer } from "@/components/ui/resizable-dialog-shell";
import { KnowledgeNoteActions } from "@/components/knowledge/KnowledgeNoteActions";
import { KnowledgeNoteEditDialog } from "@/components/knowledge/KnowledgeNoteEditDialog";
import { LinkedKnowledgeNotesSection } from "@/components/knowledge/LinkedKnowledgeNotesSection";
import { LinkKnowledgeNoteSearch } from "@/components/knowledge/LinkKnowledgeNoteSearch";
import { useAppShortcuts } from "@/hooks/useAppShortcuts";
import { useKnowledgeForQuestion } from "@/hooks/useKnowledgeForQuestion";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useKnowledgeNoteDialog } from "@/hooks/useKnowledgeNoteDialog";
import { buildKnowledgeDraft, stashKnowledgeDraft } from "@/lib/knowledgeDraft";
import { questionLinkKey } from "@/lib/knowledgeLinks";
import { formatKeybind } from "@/lib/keybinds";
import { useShortcutHandler } from "@/hooks/useShortcutHandler";
import { errorMessage } from "@/lib/native";
import type { KnowledgeItem } from "@/types/knowledge";

export function QuestionKnowledgeNotesPanel({
  quizId,
  questionId,
  currentNoteId,
  noteDialogLayer,
  placeholder,
}: {
  quizId: string;
  questionId: string;
  currentNoteId?: string;
  noteDialogLayer?: DialogStackLayer;
  placeholder?: string;
}) {
  const linkedNotes = useKnowledgeForQuestion(quizId, questionId);
  const { items, saveItem } = useKnowledgeLibrary();
  const { knowledgeLink, knowledgeNewNote } = useAppShortcuts();
  const {
    activeNote,
    noteDialogOpen,
    noteDialogMode,
    openNote,
    handleOpenChange,
    handleSaved,
  } = useKnowledgeNoteDialog();
  const [linkSearchOpen, setLinkSearchOpen] = useState(false);
  const questionKey = questionLinkKey(quizId, questionId);
  const hasLinkableNotes = useMemo(
    () =>
      items.some(
        (item) =>
          !item.linkedQuizQuestions.some(
            (link) => questionLinkKey(link.quizId, link.questionId) === questionKey,
          ),
      ),
    [items, questionKey],
  );

  const handleAddNote = useCallback(() => {
    setLinkSearchOpen(false);
    const draft = buildKnowledgeDraft({
      linkedQuizQuestions: [{ quizId, questionId }],
    });
    stashKnowledgeDraft(draft);
    openNote(draft, "edit");
  }, [openNote, questionId, quizId]);

  const handleOpenLinkSearch = useCallback(() => {
    if (!hasLinkableNotes) return;
    setLinkSearchOpen(true);
  }, [hasLinkableNotes]);

  const handleUnlinkNote = useCallback(
    async (item: KnowledgeItem) => {
      try {
        await saveItem({
          ...item,
          linkedQuizQuestions: item.linkedQuizQuestions.filter(
            (link) => questionLinkKey(link.quizId, link.questionId) !== questionKey,
          ),
        });
      } catch (error) {
        toast.error(errorMessage(error));
      }
    },
    [questionKey, saveItem],
  );

  useShortcutHandler(knowledgeLink, handleOpenLinkSearch, {
    enabled: !placeholder && !linkSearchOpen && !noteDialogOpen,
  });

  useShortcutHandler(knowledgeNewNote, handleAddNote, {
    enabled: !placeholder && !linkSearchOpen && !noteDialogOpen,
  });

  const actions = (
    <KnowledgeNoteActions
      onLink={handleOpenLinkSearch}
      onAdd={handleAddNote}
      linkDisabled={!hasLinkableNotes}
      linkLabel={`Link (${formatKeybind(knowledgeLink)})`}
      newNoteLabel={`New note (${formatKeybind(knowledgeNewNote)})`}
    />
  );

  return (
    <>
      <LinkedKnowledgeNotesSection
        notes={linkedNotes}
        currentNoteId={currentNoteId}
        onSelectNote={(item) => openNote(item, "view")}
        onUnlinkNote={handleUnlinkNote}
        headerActions={actions}
        placeholder={placeholder}
      />

      <LinkKnowledgeNoteSearch
        open={linkSearchOpen}
        onOpenChange={setLinkSearchOpen}
        quizId={quizId}
        questionId={questionId}
      />

      {activeNote && (
        <KnowledgeNoteEditDialog
          item={activeNote}
          open={noteDialogOpen}
          initialMode={noteDialogMode}
          readOnlyLinkedQuestion={{ quizId, questionId }}
          onSaved={handleSaved}
          onOpenChange={handleOpenChange}
          layer={noteDialogLayer}
        />
      )}
    </>
  );
}
