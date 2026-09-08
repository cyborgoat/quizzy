import { confirm } from "@tauri-apps/plugin-dialog";
import {
  Archive,
  ArchiveRestore,
  ClipboardList,
  Pencil,
  Play,
  Target,
  Trash2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState, type MouseEvent } from "react";
import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { GoalAttemptRow } from "@/components/goals/GoalAttemptRow";
import { GoalSettingsDialog } from "@/components/goals/GoalSettingsDialog";
import { QuizStatusBadge } from "@/components/quiz/QuizStatusBadge";
import { Button } from "@/components/ui/button";
import { buttonClassName } from "@/components/ui/button-styles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconActionButton } from "@/components/ui/icon-action-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import { useGoals } from "@/hooks/useGoals";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { quizProgressMetrics, quizProgressStatus } from "@/lib/quizProgress";
import type { Goal } from "@/types/goal";
import type { QuizSource } from "@/types/quiz";

export function QuizDetailsDialog({
  source,
  goal,
  onOpenChange,
}: {
  source: QuizSource | null;
  goal: Goal | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  const { deleteAttempt, refreshAfterSync } = useGoals();
  const { setQuizArchived, deleteQuizFile } = useQuizLibrary();
  const { openQuizStart } = useQuizStartDialog();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [managementAction, setManagementAction] = useState<
    "archive" | "restore" | "delete" | null
  >(null);

  if (!source) return null;

  const quiz = source.quiz;
  const archived = source.archived;
  const fileName = source.fileName;
  const isManagingQuiz = managementAction !== null;
  const status = quizProgressStatus(goal);
  const { attemptCount, highestScore } = quizProgressMetrics(goal);
  const attempts = goal ? [...goal.attempts].reverse() : [];

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

  function handleStart() {
    if (archived) return;
    openQuizStart({ quizId: quiz.id });
    onOpenChange(false);
  }

  async function handleArchiveChange(archived: boolean) {
    setManagementAction(archived ? "archive" : "restore");
    const updated = await setQuizArchived(quiz.id, archived);
    setManagementAction(null);
    if (updated) onOpenChange(false);
  }

  async function handleDeleteQuiz() {
    const approved = await confirm(
      `Permanently delete "${quiz.title}"? The quiz file, goal, attempts, and mistake history will be removed. This cannot be undone.`,
      { title: "Delete quiz permanently?", kind: "warning" },
    );
    if (!approved) return;

    setManagementAction("delete");
    const deleted = await deleteQuizFile(fileName);
    await refreshAfterSync();
    if (deleted) {
      setManagementAction(null);
      onOpenChange(false);
      return;
    }
    setManagementAction(null);
  }

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <div className="mb-3">
              <QuizStatusBadge status={archived ? "archived" : status} />
            </div>
            <DialogTitle>{quiz.title}</DialogTitle>
            <DialogDescription>
              {goal?.description.trim() || quiz.description || "No description provided."}
            </DialogDescription>
          </DialogHeader>

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 text-sm sm:grid-cols-4">
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

          {!archived && (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                className="w-full bg-zinc-900 hover:bg-zinc-800 sm:flex-1"
                onClick={handleStart}
              >
                <Play className="size-4 fill-current" />
                {attemptCount > 0 ? "Retake quiz" : "Start quiz"}
              </Button>
              <div className="flex items-center gap-1">
                {goal ? (
                  <>
                    <IconActionButton
                      icon={Pencil}
                      label="Goal settings"
                      onClick={() => setSettingsOpen(true)}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to="/mistakes"
                          search={{ quizId: quiz.id }}
                          aria-label="View mistakes"
                          className={buttonClassName({
                            variant: "ghost",
                            size: "icon",
                            className: "size-8 text-zinc-900 hover:bg-zinc-100/60",
                          })}
                        >
                          <ClipboardList className="size-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">View mistakes</TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <CreateGoalDialog
                    quiz={quiz}
                    triggerTooltip="Add goal"
                    trigger={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-zinc-900 hover:bg-zinc-100/60"
                        aria-label="Add goal"
                      >
                        <Target className="size-4" />
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          )}

          {archived && goal && (
            <div className="mt-4 flex items-center gap-1">
              <IconActionButton
                icon={Pencil}
                label="Goal settings"
                onClick={() => setSettingsOpen(true)}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/mistakes"
                    search={{ quizId: quiz.id }}
                    aria-label="View mistakes"
                    className={buttonClassName({
                      variant: "ghost",
                      size: "icon",
                      className: "size-8 text-zinc-900 hover:bg-zinc-100/60",
                    })}
                  >
                    <ClipboardList className="size-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">View mistakes</TooltipContent>
              </Tooltip>
            </div>
          )}

          <section className="mt-6 border-t border-zinc-200 pt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-950">Attempt history</h3>
              <span className="text-xs tabular-nums text-zinc-500">{attemptCount}</span>
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

          <footer className="mt-6 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4">
            <span className="min-w-0 truncate text-xs text-zinc-500" title={fileName}>
              {fileName}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <IconActionButton
                icon={archived ? ArchiveRestore : Archive}
                label={
                  managementAction === "restore"
                    ? "Restoring…"
                    : managementAction === "archive"
                      ? "Archiving…"
                      : archived
                        ? "Restore quiz"
                        : "Archive quiz"
                }
                disabled={isManagingQuiz}
                onClick={() => void handleArchiveChange(!archived)}
              />
              <IconActionButton
                icon={Trash2}
                label={managementAction === "delete" ? "Deleting…" : "Permanently delete quiz"}
                disabled={isManagingQuiz}
                className="text-zinc-600 hover:bg-red-50 hover:text-red-600 focus-visible:bg-red-50 focus-visible:text-red-600"
                onClick={() => void handleDeleteQuiz()}
              />
            </div>
          </footer>
        </DialogContent>
      </Dialog>

      {goal && (
        <GoalSettingsDialog
          goal={goal}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      )}
    </>
  );
}
