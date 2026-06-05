import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuizActionBar({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onSubmitQuiz,
}: {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmitQuiz: () => void;
}) {
  return (
    <footer className="sticky bottom-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex gap-2">
          <Button
            aria-label="Previous question"
            className="px-3 sm:px-4"
            variant="outline"
            onClick={onPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button
            aria-label="Next question"
            className="px-3 sm:px-4"
            variant="outline"
            onClick={onNext}
            disabled={currentIndex === totalQuestions - 1}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button className="px-3 sm:px-4" onClick={onSubmitQuiz}>
            <span className="sm:hidden">Submit</span>
            <span className="hidden sm:inline">Submit quiz</span>
          </Button>
        </div>
      </div>
    </footer>
  );
}
