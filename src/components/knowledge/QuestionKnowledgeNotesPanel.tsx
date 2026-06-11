import { useState } from "react";
import { KnowledgeNoteActions } from "@/components/knowledge/KnowledgeNoteActions";
import { KnowledgeNoteEditDialog } from "@/components/knowledge/KnowledgeNoteEditDialog";
import { LinkedKnowledgeNotesSection } from "@/components/knowledge/LinkedKnowledgeNotesSection";
import { LinkKnowledgeNoteDialog } from "@/components/knowledge/LinkKnowledgeNoteDialog";
import { useKnowledgeForQuestion } from "@/hooks/useKnowledgeForQuestion";
import { useKnowledgeNoteDialog } from "@/hooks/useKnowledgeNoteDialog";
import { buildKnowledgeDraft, stashKnowledgeDraft } from "@/lib/knowledgeDraft";

export function QuestionKnowledgeNotesPanel({
  quizId,
  questionId,
  currentNoteId,
}: {
  quizId: string;
  questionId: string;
  currentNoteId?: string;
}) {
  const linkedNotes = useKnowledgeForQuestion(quizId, questionId);
  const {
    activeNote,
    noteDialogOpen,
    noteDialogMode,
    openNote,
    handleOpenChange,
    handleSaved,
  } = useKnowledgeNoteDialog();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  function handleAddNote() {
    const draft = buildKnowledgeDraft({
      linkedQuizQuestions: [{ quizId, questionId }],
    });
    stashKnowledgeDraft(draft);
    openNote(draft, "edit");
  }

  const actions = (
    <KnowledgeNoteActions
      onLink={() => setLinkDialogOpen(true)}
      onAdd={handleAddNote}
    />
  );

  return (
    <>
      <LinkedKnowledgeNotesSection
        notes={linkedNotes}
        currentNoteId={currentNoteId}
        onSelectNote={(item) => openNote(item, "view")}
        headerActions={actions}
      />

      {linkDialogOpen && (
        <LinkKnowledgeNoteDialog
          open={linkDialogOpen}
          onOpenChange={setLinkDialogOpen}
          quizId={quizId}
          questionId={questionId}
        />
      )}

      {activeNote && (
        <KnowledgeNoteEditDialog
          item={activeNote}
          open={noteDialogOpen}
          initialMode={noteDialogMode}
          readOnlyLinkedQuestion={{ quizId, questionId }}
          onSaved={handleSaved}
          onOpenChange={handleOpenChange}
        />
      )}
    </>
  );
}
