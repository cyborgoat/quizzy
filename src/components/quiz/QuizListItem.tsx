import { confirm } from "@tauri-apps/plugin-dialog";
import {
  ArrowRight,
  ClipboardList,
  ListChecks,
  Pencil,
  Target,
  Trash2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AddGoalDialog } from "@/components/goals/AddGoalDialog";
import { GoalSettingsDialog } from "@/components/goals/GoalSettingsDialog";
import { knowledgeTagBadgeClassName } from "@/components/knowledge/knowledgeStyles";
import { quizCardActionClass } from "@/components/quiz/quiz-card-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuizStartDialog } from "@/hooks/useQuizStartDialog";
import { useGoals } from "@/hooks/useGoals";
import type { QuizSource } from "@/types/quiz";

export function QuizListItem({ source }: { source: QuizSource }) {
  const { goals, deleteGoal } = useGoals();
  const { openQuizStart } = useQuizStartDialog();
  const goal = goals.find((item) => item.quizId === source.quiz.id);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isGoalMenuOpen, setIsGoalMenuOpen] = useState(false);
  const hasAttempts = Boolean(goal?.attempts.length);
  const highestScore = hasAttempts
    ? Math.max(...goal!.attempts.map((attempt) => attempt.percentage))
    : undefined;
  const targetAchieved =
    goal?.targetScore !== undefined &&
    highestScore !== undefined &&
    highestScore >= goal.targetScore;
  const goalIconClass =
    goal && !goal.completed
      ? targetAchieved
        ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
        : "text-amber-700 hover:bg-amber-50 hover:text-amber-800"
      : "text-zinc-950 hover:bg-zinc-100 hover:text-zinc-950";
  async function handleDeleteGoal() {
    if (!goal) return;
    const approved = await confirm(
      `Delete the goal for "${source.quiz.title}" and all of its attempt history? This cannot be undone.`,
      { title: "Delete goal?", kind: "warning" },
    );
    if (!approved) return;
    setIsDeletingGoal(true);
    await deleteGoal(goal.id);
    setIsDeletingGoal(false);
  }

  function handleEditGoal() {
    setIsGoalMenuOpen(false);
    window.setTimeout(() => setIsEditingGoal(true), 0);
  }

  return (
    <article className="group flex flex-col rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">{source.quiz.title}</h2>
          <p className="mt-0.5 text-xs text-zinc-500">{source.fileName}</p>
        </div>
        <div className="flex items-center gap-1">
          {goal ? (
            <DropdownMenu
              open={isGoalMenuOpen}
              onOpenChange={setIsGoalMenuOpen}
              modal={false}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`size-7 ${goalIconClass}`}
                  disabled={isDeletingGoal}
                  aria-label={`Open goal actions for ${source.quiz.title}`}
                >
                  <Target className="size-4" strokeWidth={2.5} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleEditGoal}>
                  <Pencil />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/goals" search={{ expand: goal.id }}>
                    <ListChecks />
                    Attempts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/mistakes" search={{ quizId: source.quiz.id }}>
                    <ClipboardList />
                    Mistakes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => void handleDeleteGoal()}
                  disabled={isDeletingGoal}
                >
                  <Trash2 />
                  {isDeletingGoal ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <AddGoalDialog quiz={source.quiz} />
          )}
          {goal && (
            <GoalSettingsDialog
              goal={goal}
              open={isEditingGoal}
              onOpenChange={setIsEditingGoal}
            />
          )}
        </div>
      </div>
      <p className="mt-3 flex-1 text-xs leading-5 text-zinc-600">
        {source.quiz.description ?? "No description provided."}
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {source.quiz.tags.map((tag) => (
          <Badge key={tag} className={knowledgeTagBadgeClassName}>
            {tag}
          </Badge>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-3">
        <span className="text-xs text-zinc-500">
          {source.quiz.questions.length} questions
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={quizCardActionClass}
            onClick={() =>
              openQuizStart({
                quizId: source.quiz.id,
                defaultMode: "practice",
                from: "home",
              })
            }
          >
            Start <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
