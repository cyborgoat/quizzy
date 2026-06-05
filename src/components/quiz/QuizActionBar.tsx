import { Home } from "lucide-react";
import { quizChromeFooterClass } from "@/components/quiz/quiz-chrome";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function QuizActionBar({
  onSubmitQuiz,
  onExitQuiz,
}: {
  onSubmitQuiz: () => void;
  onExitQuiz: () => void;
}) {
  const isMobile = useIsMobile();

  return (
    <footer className={`${quizChromeFooterClass} sticky bottom-0 z-20 bg-white/95 backdrop-blur`}>
      <div className="mx-auto flex h-full max-w-3xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {isMobile && (
            <SidebarTrigger
              className="size-8 border border-zinc-200 bg-white hover:bg-zinc-100"
              aria-label="Open question sidebar"
            />
          )}
          <Button variant="outline" className="px-3 sm:px-4" onClick={onExitQuiz}>
            <Home className="size-3.5" />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Home</span>
          </Button>
        </div>
        <Button className="px-3 sm:px-4" onClick={onSubmitQuiz}>
          <span className="sm:hidden">Submit</span>
          <span className="hidden sm:inline">Submit quiz</span>
        </Button>
      </div>
    </footer>
  );
}
