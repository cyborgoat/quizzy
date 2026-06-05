import { Home, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  const percentage = Math.round((score / quiz.questions.length) * 100);
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Quiz complete</p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-950">{quiz.title}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ResultMetric label="Score" value={`${score}/${quiz.questions.length}`} />
        <ResultMetric label="Percentage" value={`${percentage}%`} />
        <ResultMetric label="Incorrect" value={String(quiz.questions.length - score)} />
        <ResultMetric label="Unanswered" value={String(unansweredCount)} />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={onRestart}>
          <RotateCcw className="size-4" /> Restart quiz
        </Button>
        <Link
          to="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
        >
          <Home className="size-4" /> Return home
        </Link>
      </div>
    </section>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-100 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}
