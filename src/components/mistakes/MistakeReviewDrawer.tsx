import { FilePlus, Link2 } from "lucide-react";
import { useMemo, useState } from "react";
import { KnowledgeNoteEditDialog } from "@/components/knowledge/KnowledgeNoteEditDialog";
import { LinkKnowledgeNoteDialog } from "@/components/knowledge/LinkKnowledgeNoteDialog";
import { ReviewQuestionDetail } from "@/components/quiz/ReviewQuestionDetail";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useKnowledgeIndex } from "@/hooks/useKnowledgeIndex";
import { formatShortDate } from "@/lib/formatDate";
import { remapAnswerToFileQuestion } from "@/lib/quizReview";
import { buildKnowledgeDraft, stashKnowledgeDraft } from "@/lib/knowledgeDraft";
import { getKnowledgeForQuestion } from "@/lib/knowledgeIndex";
import type { KnowledgeItem } from "@/types/knowledge";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

function KnowledgeNoteActions({
  onLink,
  onAdd,
}: {
  onLink: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-zinc-900 hover:bg-zinc-100/60"
            onClick={onLink}
            aria-label="Link existing note"
          >
            <Link2 className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="z-70">
          Link existing note
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-zinc-900 hover:bg-zinc-100/60"
            onClick={onAdd}
            aria-label="Add new note"
          >
            <FilePlus className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="z-70">
          Add new note
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function MistakeReviewDrawer({
  entry,
  question,
  questionIndex,
  open,
  onOpenChange,
}: {
  entry: MistakeEntry | null;
  question: QuizQuestion | null;
  questionIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const knowledgeIndex = useKnowledgeIndex();
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteDialogMode, setNoteDialogMode] = useState<"view" | "edit">("view");
  const [activeNote, setActiveNote] = useState<KnowledgeItem | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const linkedNotes = useMemo(() => {
    if (!entry) return [];
    return getKnowledgeForQuestion(knowledgeIndex, entry.quizId, entry.questionId);
  }, [entry, knowledgeIndex]);

  const record: AnswerRecord | null = useMemo(() => {
    if (!entry) return null;
    return {
      questionId: entry.questionId,
      answer:
        question && entry.lastIncorrectAnswer
          ? remapAnswerToFileQuestion(
              question,
              entry.lastIncorrectAnswer,
              entry.lastIncorrectOptions,
            )
          : entry.lastIncorrectAnswer,
      isCorrect: entry.mistakeCount === 0,
      flagged: entry.flaggedCount > 0,
    };
  }, [entry, question]);

  if (!entry || !record) return null;
  const currentEntry = entry;

  function openNote(item: KnowledgeItem, mode: "view" | "edit") {
    setActiveNote(item);
    setNoteDialogMode(mode);
    setNoteDialogOpen(true);
  }

  function handleAddNote() {
    const draft = buildKnowledgeDraft({
      linkedQuizQuestions: [
        { quizId: currentEntry.quizId, questionId: currentEntry.questionId },
      ],
    });
    stashKnowledgeDraft(draft);
    openNote(draft, "edit");
  }

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        direction="right"
        shouldScaleBackground={false}
      >
        <DrawerContent className="flex h-full w-full max-w-xl min-w-0 flex-col overflow-x-hidden lg:max-w-2xl">
          <DrawerHeader className="shrink-0 border-b border-zinc-100">
            <DrawerTitle>Review mistake</DrawerTitle>
            <DrawerDescription>
              {currentEntry.quizTitle} · {currentEntry.mistakeCount} mistake
              {currentEntry.mistakeCount === 1 ? "" : "s"} · Last mistaken{" "}
              {formatShortDate(currentEntry.lastMistakenAt)} · {currentEntry.flaggedCount} flag
              {currentEntry.flaggedCount === 1 ? "" : "s"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-w-0 flex-1 overflow-x-clip overflow-y-auto p-4">
            {question ? (
              <ReviewQuestionDetail
                question={question}
                index={questionIndex}
                record={record}
              />
            ) : (
              <article className="rounded-lg border border-zinc-200 bg-white p-4">
                <p className="text-sm font-semibold text-zinc-950">{currentEntry.prompt}</p>
                <p className="mt-3 text-sm text-zinc-600">
                  This question could not be loaded from the quiz file. It may have been removed or
                  the quiz file is unavailable.
                </p>
              </article>
            )}

            <Separator className="my-5" />

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-zinc-950">
                  Knowledge notes ({linkedNotes.length})
                </h2>
                <KnowledgeNoteActions
                  onLink={() => setLinkDialogOpen(true)}
                  onAdd={handleAddNote}
                />
              </div>

              {linkedNotes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center">
                  <p className="text-sm text-zinc-600">
                    No knowledge notes linked to this question yet.
                  </p>
                  <div className="mt-3 flex justify-center">
                    <KnowledgeNoteActions
                      onLink={() => setLinkDialogOpen(true)}
                      onAdd={handleAddNote}
                    />
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
                  {linkedNotes.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => openNote(item, "view")}
                        className="w-full px-3 py-2.5 text-left text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50"
                      >
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </DrawerContent>
      </Drawer>

      <LinkKnowledgeNoteDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        quizId={currentEntry.quizId}
        questionId={currentEntry.questionId}
      />

      {activeNote && (
        <KnowledgeNoteEditDialog
          item={activeNote}
          open={noteDialogOpen}
          initialMode={noteDialogMode}
          readOnlyLinkedQuestion={{
            quizId: currentEntry.quizId,
            questionId: currentEntry.questionId,
          }}
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
