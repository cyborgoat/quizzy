import { CheckCircle2, Home, RotateCcw, Target } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/types/quiz";

export function ResultSummary({
  quiz,
  score,
  total,
  modeLabel,
  unansweredCount,
  goal,
  onRestart,
}: {
  quiz: Quiz;
  score: number;
  total: number;
  modeLabel?: string;
  unansweredCount: number;
  goal?: {
    id: string;
    achieved: boolean;
  };
  onRestart: () => void;
}) {
  const navigate = useNavigate();
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const incorrect = total - score - unansweredCount;

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="px-5 py-4">
        {modeLabel ? (
          <>
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              {modeLabel}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Quiz complete
            </p>
          </>
        ) : (
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Quiz complete
          </p>
        )}
        <h1 className="mt-1 text-lg font-semibold text-zinc-950">{quiz.title}</h1>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-zinc-200 bg-zinc-200 sm:grid-cols-4">
        <ResultMetric label="Score" value={`${percentage}%`} prominent />
        <ResultMetric label="Correct" value={`${score}/${total}`} />
        <ResultMetric label="Incorrect" value={String(incorrect)} />
        <ResultMetric label="Unanswered" value={String(unansweredCount)} />
      </div>

      {goal && (
        <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-800">
            {goal.achieved ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <Target className="size-4 text-amber-600" />
            )}
            Goal status: {goal.achieved ? "Achieved" : "Not achieved yet"}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-zinc-200 p-4">
        <Button onClick={onRestart}>
          <RotateCcw className="size-4" />
          Restart quiz
        </Button>
        {goal && (
          <Button
            variant="outline"
            onClick={() => navigate({ to: "/goals", search: { expand: goal.id } })}
          >
            <Target className="size-4" />
            View goal attempts
          </Button>
        )}
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          <Home className="size-4" />
          Return home
        </Button>
      </div>
    </section>
  );
}

function ResultMetric({
  label,
  value,
  prominent = false,
}: {
  label: string;
  value: string;
  prominent?: boolean;
}) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-semibold text-zinc-950",
          prominent ? "text-xl" : "text-base",
        )}
      >
        {value}
      </p>
    </div>
  );
}
