import { useMemo, useState } from "react";
import { KnowledgeNoteActions } from "@/components/knowledge/KnowledgeNoteActions";
import { KnowledgeNoteEditDialog } from "@/components/knowledge/KnowledgeNoteEditDialog";
import { LinkedKnowledgeNotesSection } from "@/components/knowledge/LinkedKnowledgeNotesSection";
import { LinkKnowledgeNoteDialog } from "@/components/knowledge/LinkKnowledgeNoteDialog";
import { useKnowledgeIndex } from "@/hooks/useKnowledgeIndex";
import { buildKnowledgeDraft, stashKnowledgeDraft } from "@/lib/knowledgeDraft";
import { getKnowledgeForQuestion } from "@/lib/knowledgeIndex";
import { cn } from "@/lib/utils";
import type { KnowledgeItem } from "@/types/knowledge";

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
  const knowledgeIndex = useKnowledgeIndex();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteDialogMode, setNoteDialogMode] = useState<"view" | "edit">("view");
  const [activeNote, setActiveNote] = useState<KnowledgeItem | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const linkedNotes = useMemo(
    () => getKnowledgeForQuestion(knowledgeIndex, quizId, questionId),
    [knowledgeIndex, quizId, questionId],
  );

  function openNote(item: KnowledgeItem, mode: "view" | "edit") {
    setActiveNote(item);
    setNoteDialogMode(mode);
    setNoteDialogOpen(true);
  }

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

      <LinkKnowledgeNoteDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        quizId={quizId}
        questionId={questionId}
      />

      {activeNote && (
        <KnowledgeNoteEditDialog
          item={activeNote}
          open={noteDialogOpen}
          initialMode={noteDialogMode}
          readOnlyLinkedQuestion={{ quizId, questionId }}
          onSaved={(saved) => {
            setActiveNote(saved);
            setNoteDialogMode("view");
          }}
          onOpenChange={(nextOpen) => {
            setNoteDialogOpen(nextOpen);
            if (!nextOpen) {
              setActiveNote(null);
            }
          }}
        />
      )}
    </>
  );
}
