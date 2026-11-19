import { confirm } from "@tauri-apps/plugin-dialog";
import { type MouseEvent } from "react";
import { GoalAttemptRow } from "@/components/goals/GoalAttemptRow";
import { QuizStatusBadge } from "@/components/quiz/QuizStatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGoals } from "@/hooks/useGoals";
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
  const { deleteAttempt } = useGoals();

  if (!source) return null;

  const quiz = source.quiz;
  const archived = source.archived;
  const fileName = source.fileName;
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

  return (
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

        <footer className="mt-6 flex items-center border-t border-zinc-200 pt-4">
          <span className="min-w-0 truncate text-xs text-zinc-500" title={fileName}>
            {fileName}
          </span>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
