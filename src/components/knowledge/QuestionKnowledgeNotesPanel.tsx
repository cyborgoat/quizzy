import { useState } from "react";
import { KnowledgeNoteActions } from "@/components/knowledge/KnowledgeNoteActions";
import { KnowledgeNoteEditDialog } from "@/components/knowledge/KnowledgeNoteEditDialog";
import { LinkedKnowledgeNotesSection } from "@/components/knowledge/LinkedKnowledgeNotesSection";
import { LinkKnowledgeNoteDialog } from "@/components/knowledge/LinkKnowledgeNoteDialog";
import { useKnowledgeForQuestion } from "@/hooks/useKnowledgeForQuestion";
import { useKnowledgeNoteDialog } from "@/hooks/useKnowledgeNoteDialog";
import { buildKnowledgeDraft, stashKnowledgeDraft } from "@/lib/knowledgeDraft";
import { cn } from "@/lib/utils";

export function QuestionKnowledgeNotesPanel({
  quizId,
  questionId,
  className,
  compact = false,
}: {
  quizId: string;
  questionId: string;
  className?: string;
  compact?: boolean;
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
      <div className={cn(className)}>
        <LinkedKnowledgeNotesSection
          notes={linkedNotes}
          onSelectNote={(item) => openNote(item, "view")}
          headerActions={actions}
          emptyActions={actions}
          compact={compact}
        />
      </div>

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
