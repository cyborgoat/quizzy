import { ChevronLeft, ChevronRight } from "lucide-react";
import { quizChromeHeaderClass } from "@/components/quiz/quiz-chrome";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function QuizHeader({
  title,
  current,
  total,
  answered,
  currentIndex,
  onPrevious,
  onNext,
}: {
  title: string;
  current: number;
  total: number;
  answered: number;
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <header className={`${quizChromeHeaderClass} bg-white`}>
      <div className="mx-auto flex h-full max-w-3xl flex-col justify-center gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="truncate text-xs font-medium text-zinc-950">{title}</p>
            <p className="text-xs text-zinc-500">
              Question {current} of {total}
            </p>
          </div>

          <div className="flex shrink-0 gap-1">
            <Button
              variant="outline"
              size="sm"
              aria-label="Previous question"
              onClick={onPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="size-3.5" />
              <span className="hidden md:inline">Previous question</span>
              <span className="hidden sm:inline md:hidden">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Next question"
              onClick={onNext}
              disabled={currentIndex === total - 1}
            >
              <span className="hidden md:inline">Next question</span>
              <span className="hidden sm:inline md:hidden">Next</span>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Progress value={(answered / total) * 100} />
          <span className="shrink-0 text-xs text-zinc-500">
            {answered} answered
          </span>
        </div>
      </div>
    </header>
  );
}
