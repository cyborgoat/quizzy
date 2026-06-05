import { Home, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/types/quiz";

export function ResultSummary({
  quiz,
  score,
  unansweredCount,
  onRestart,
}: {
  quiz: Quiz;
  score: number;
  unansweredCount: number;
  onRestart: () => void;
}) {
  const navigate = useNavigate();
  const total = quiz.questions.length;
  const percentage = Math.round((score / total) * 100);
  const incorrect = total - score - unansweredCount;

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Quiz complete
        </p>
        <h1 className="mt-1 text-lg font-semibold text-zinc-950">{quiz.title}</h1>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-zinc-200 bg-zinc-200 sm:grid-cols-4">
        <ResultMetric label="Score" value={`${percentage}%`} prominent />
        <ResultMetric label="Correct" value={`${score}/${total}`} />
        <ResultMetric label="Incorrect" value={String(incorrect)} />
        <ResultMetric label="Unanswered" value={String(unansweredCount)} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-zinc-200 p-4">
        <Button onClick={onRestart}>
          <RotateCcw className="size-4" />
          Restart quiz
        </Button>
        <Button variant="outline" onClick={() => navigate("/")}>
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
