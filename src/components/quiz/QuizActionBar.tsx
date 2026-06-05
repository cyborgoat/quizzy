import { ChevronLeft, ChevronRight } from "lucide-react";
import { quizChromeFooterClass } from "@/components/quiz/quiz-chrome";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <footer className={`${quizChromeFooterClass} sticky bottom-0 z-20 bg-white/95 backdrop-blur`}>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2">
          {isMobile && (
            <SidebarTrigger
              className="size-8 border border-zinc-200 bg-white hover:bg-zinc-100"
              aria-label="Open question sidebar"
            />
          )}
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
