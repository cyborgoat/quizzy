import { confirm } from "@tauri-apps/plugin-dialog";
import { useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  ClipboardList,
  MoreHorizontal,
  Pencil,
  Play,
  Target,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { useRef, useState, type MouseEvent } from "react";
import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { GoalAttemptRow } from "@/components/goals/GoalAttemptRow";
import { GoalSettingsDialog } from "@/components/goals/GoalSettingsDialog";
import { QuizStatusBadge } from "@/components/quiz/QuizStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGoals } from "@/hooks/useGoals";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import { quizProgressMetrics, quizProgressStatus } from "@/lib/quizProgress";
import type { Goal } from "@/types/goal";
import type { QuizSource } from "@/types/quiz";

export function QuizDetailsDialog({
  source,
  goal,
  onClose,
  restoreFocus,
}: {
  source: QuizSource;
  goal: Goal | undefined;
  onClose: () => Promise<void>;
  restoreFocus: () => void;
}) {
  const { deleteAttempt, refreshAfterSync } = useGoals();
  const { setQuizArchived, deleteQuizFile } = useQuizLibrary();
  const { openQuizStart } = useQuizStartDialog();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createGoalOpen, setCreateGoalOpen] = useState(false);
  const [managementAction, setManagementAction] = useState<
    "archive" | "restore" | "delete" | null
  >(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const startingQuiz = useRef(false);

  const quiz = source.quiz;
  const archived = source.archived;
  const fileName = source.fileName;
  const status = quizProgressStatus(goal);
  const { attemptCount, highestScore } = quizProgressMetrics(goal);
  const attempts = goal ? [...goal.attempts].reverse() : [];
  const isManagingQuiz = managementAction !== null;

  async function handleArchiveChange(nextArchived: boolean) {
    setManagementAction(nextArchived ? "archive" : "restore");
    try {
      await setQuizArchived(quiz.id, nextArchived);
    } finally {
      setManagementAction(null);
    }
  }

  async function handleDeleteQuiz() {
    const approved = await confirm(
      `Permanently delete "${quiz.title}"? The quiz file, goal, attempts, and mistake history will be removed. This cannot be undone.`,
      { title: "Delete quiz permanently?", kind: "warning" },
    );
    if (!approved) return;

    setManagementAction("delete");
    try {
      const deleted = await deleteQuizFile(fileName);
      if (deleted) await onClose();
      await refreshAfterSync();
    } finally {
      setManagementAction(null);
    }
  }

  async function handleStart() {
    startingQuiz.current = true;
    await onClose();
    openQuizStart({ quizId: quiz.id });
  }

  async function handleDeleteAttempt(attemptId: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!goal) return;
    const approved = await confirm("Delete this attempt? This cannot be undone.", {
      title: "Delete attempt?",
      kind: "warning",
    });
    if (approved) await deleteAttempt(goal.id, attemptId);
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && void onClose()}>
        <DialogContent
          showClose={false}
          className="flex max-h-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden p-0"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            titleRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!startingQuiz.current) restoreFocus();
          }}
        >
          <div className="min-h-0 overflow-y-auto p-6">
            <DialogHeader className="pr-20">
              <div className="mb-3">
                <QuizStatusBadge status={archived ? "archived" : status} />
              </div>
              <DialogTitle ref={titleRef} tabIndex={-1} className="focus:outline-none">
                {quiz.title}
              </DialogTitle>
              <DialogDescription>
                {goal?.description.trim() || quiz.description || "No description provided."}
              </DialogDescription>
            </DialogHeader>

            <section className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <h3 className="text-sm font-semibold text-zinc-950">Progress</h3>
                {goal ? (
                  <IconActionButton
                    icon={Pencil}
                    label="Goal settings"
                    disabled={isManagingQuiz}
                    onClick={() => setSettingsOpen(true)}
                  />
                ) : !archived && (
                  <IconActionButton
                    icon={Target}
                    label="Add goal"
                    disabled={isManagingQuiz}
                    onClick={() => setCreateGoalOpen(true)}
                  />
                )}
              </div>

              <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 text-sm sm:grid-cols-4">
                {[
                  ["Questions", quiz.questions.length],
                  ["Attempts", attemptCount],
                  ["Highest score", highestScore === undefined ? "—" : `${highestScore}%`],
                  ["Target", goal?.targetScore === undefined ? "—" : `${goal.targetScore}%`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white px-3 py-3">
                    <dt className="text-xs text-zinc-500">{label}</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums text-zinc-950">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-6 border-t border-zinc-200 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <h3 className="text-sm font-semibold text-zinc-950">Attempt history</h3>
                {goal && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <IconActionButton icon={ClipboardList} label="View mistakes" />
                    </DialogTrigger>
                    <DialogContent
                      role="alertdialog"
                      showClose={false}
                      className="max-w-[calc(100%-2rem)] sm:max-w-sm"
                      onInteractOutside={(event) => event.preventDefault()}
                    >
                      <DialogTitle className="flex items-center gap-2">
                        <TriangleAlert className="size-5 shrink-0 text-amber-600" aria-hidden="true" />
                        Open Mistakes page?
                      </DialogTitle>
                      <DialogDescription>
                        You’ll leave the quiz details and open the Mistakes page for this quiz.
                      </DialogDescription>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={() => void navigate({ to: "/mistakes", search: { quizId: quiz.id } })}>
                          View mistakes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {attempts.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
                  No saved attempts yet. Add a goal before starting if you want results to be recorded.
                </p>
              ) : (
                <ul className="-mx-3 mt-2 divide-y divide-zinc-100">
                  {attempts.map((attempt) => (
                    <li key={attempt.id}>
                      <GoalAttemptRow
                        quizId={quiz.id}
                        targetScore={goal?.targetScore}
                        attempt={attempt}
                        showQuizTitle={false}
                        onDelete={(event) => void handleDeleteAttempt(attempt.id, event)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <TooltipProvider delayDuration={500} skipDelayDuration={0}>
            <footer className="flex shrink-0 items-center gap-4 border-t border-zinc-200 px-6 py-4">
              <span className="min-w-0 flex-1 truncate text-xs text-zinc-500" title={fileName}>
                {fileName}
              </span>
              {archived ? (
                <IconActionButton
                  icon={ArchiveRestore}
                  label={managementAction === "restore" ? "Restoring…" : "Restore to start"}
                  variant="default"
                  tooltipSide="top"
                  disabled={isManagingQuiz}
                  onClick={() => void handleArchiveChange(false)}
                />
              ) : (
                <Button
                  size="sm"
                  disabled={isManagingQuiz}
                  onClick={() => void handleStart()}
                >
                  <Play className="size-3.5 shrink-0" aria-hidden="true" />
                  {attemptCount > 0 ? "Retake quiz" : "Start quiz"}
                </Button>
              )}
            </footer>

            <div className="absolute right-4 top-4 flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconActionButton
                    icon={MoreHorizontal}
                    label="Manage quiz"
                    className="text-zinc-500 aria-expanded:bg-zinc-100"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end" className="z-60">
                  {!archived && (
                    <DropdownMenuItem
                      disabled={isManagingQuiz}
                      onSelect={() => void handleArchiveChange(true)}
                    >
                      <Archive aria-hidden="true" />
                      {managementAction === "archive" ? "Archiving…" : "Archive quiz"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isManagingQuiz}
                    onSelect={() => void handleDeleteQuiz()}
                  >
                    <Trash2 aria-hidden="true" />
                    {managementAction === "delete" ? "Deleting…" : "Delete quiz"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DialogClose asChild>
                <IconActionButton
                  icon={X}
                  label="Close"
                  className="text-zinc-500 hover:bg-zinc-100"
                />
              </DialogClose>
            </div>
          </TooltipProvider>
        </DialogContent>
      </Dialog>
      {goal ? (
        <GoalSettingsDialog
          goal={goal}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      ) : (
        <CreateGoalDialog
          quiz={quiz}
          open={createGoalOpen}
          onOpenChange={setCreateGoalOpen}
        />
      )}
    </>
  );
}
