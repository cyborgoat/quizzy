import { Plus, X } from "lucide-react";
import { useState } from "react";
import { AttemptReviewPanelLoader } from "@/components/goals/AttemptReviewPanel";
import { GoalCard } from "@/components/goals/GoalCard";
import { EmptyState } from "@/components/quiz/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGoals } from "@/hooks/useGoals";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import type { AttemptSummary } from "@/types/goal";

type ReviewSelection = {
  goalId: string;
  attemptId: string;
  quizId: string;
  quizTitle: string;
} | null;

const DEFAULT_FORM = {
  quizId: "",
  description: "",
  targetScore: "",
  deadline: "",
};

export function GoalsPage() {
  const { goals, addGoal, loadGoalAttempt } = useGoals();
  const { quizzes } = useQuizLibrary();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [review, setReview] = useState<ReviewSelection>(null);

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  function closeReview() {
    setReview(null);
  }

  function handleField(field: keyof typeof DEFAULT_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.quizId || !form.description.trim()) return;
    const quiz = quizzes.find((q) => q.quiz.id === form.quizId);
    if (!quiz) return;
    await addGoal({
      quizId: form.quizId,
      quizTitle: quiz.quiz.title,
      description: form.description.trim(),
      targetScore: form.targetScore ? Number(form.targetScore) : undefined,
      deadline: form.deadline || undefined,
    });
    setForm(DEFAULT_FORM);
    setShowForm(false);
  }

  function handleReviewAttempt(
    attempt: AttemptSummary,
    goalId: string,
    quizId: string,
    quizTitle: string,
  ) {
    if (review?.goalId === goalId && review.attemptId === attempt.id) {
      closeReview();
      return;
    }
    setReview({ goalId, attemptId: attempt.id, quizId, quizTitle });
  }

  return (
    <div className="flex min-h-svh">
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Goals</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Set quiz goals to track your progress and stay motivated.
          </p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            New goal
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-950">New goal</h2>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 text-zinc-500"
              onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); }}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                Quiz <span className="text-red-500">*</span>
              </label>
              <select
                value={form.quizId}
                onChange={(e) => handleField("quizId", e.target.value)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 sm:max-w-xs"
              >
                <option value="">Select a quiz…</option>
                {quizzes.map((q) => (
                  <option key={q.quiz.id} value={q.quiz.id}>
                    {q.quiz.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-700" htmlFor="goal-description">
                What do you want to achieve? <span className="text-red-500">*</span>
              </label>
              <Input
                id="goal-description"
                value={form.description}
                onChange={(e) => handleField("description", e.target.value)}
                placeholder="e.g. Score at least 80% without hints"
                className="sm:max-w-md"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700" htmlFor="goal-score">
                  Target score (%)
                </label>
                <Input
                  id="goal-score"
                  type="number"
                  min={0}
                  max={100}
                  value={form.targetScore}
                  onChange={(e) => handleField("targetScore", e.target.value)}
                  placeholder="e.g. 80"
                  className="w-32"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700" htmlFor="goal-deadline">
                  Deadline
                </label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => handleField("deadline", e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button
              onClick={() => void handleCreate()}
              disabled={!form.quizId || !form.description.trim()}
            >
              Create goal
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Set a goal for a quiz to track your progress and keep yourself accountable."
          actionLabel="New goal"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-8">
          {activeGoals.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Active · {activeGoals.length}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onReviewAttempt={handleReviewAttempt}
                    activeReviewAttemptId={review?.attemptId}
                  />
                ))}
              </div>
            </section>
          )}

          {completedGoals.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Complete · {completedGoals.length}
              </h2>
              <div className="grid gap-3 opacity-60 md:grid-cols-2 xl:grid-cols-3">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onReviewAttempt={handleReviewAttempt}
                    activeReviewAttemptId={review?.attemptId}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
        </main>
      </div>

      {review && (
        <AttemptReviewPanelLoader
          key={`${review.goalId}-${review.attemptId}`}
          goalId={review.goalId}
          attemptId={review.attemptId}
          quizId={review.quizId}
          quizTitle={review.quizTitle}
          loadGoalAttempt={loadGoalAttempt}
          onClose={closeReview}
        />
      )}
    </div>
  );
}
