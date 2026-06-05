import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { quizChromeHeaderClass } from "@/components/quiz/quiz-chrome";
import { Progress } from "@/components/ui/progress";

export function QuizHeader({
  title,
  current,
  total,
  answered,
}: {
  title: string;
  current: number;
  total: number;
  answered: number;
}) {
  return (
    <header className={`${quizChromeHeaderClass} bg-white`}>
      <div className="mx-auto flex h-full max-w-3xl flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-zinc-600 outline-none hover:text-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-500"
          >
            <ArrowLeft className="size-3.5" /> Back
          </Link>
          <p className="min-w-0 truncate text-xs font-medium text-zinc-950">{title}</p>
          <p className="shrink-0 text-xs text-zinc-500">
            {current} / {total}
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Progress value={(answered / total) * 100} />
          <span className="shrink-0 text-xs text-zinc-500">
            {answered} answered
          </span>
        </div>
      </div>
    </header>
  );
}
