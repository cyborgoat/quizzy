import { Home } from "lucide-react";
import { quizChromeFooterClass } from "@/components/quiz/quiz-chrome";
import { Button } from "@/components/ui/button";

export function QuizActionBar({
  onExitQuiz,
  onSubmitQuiz,
}: {
  onExitQuiz: () => void;
  onSubmitQuiz: () => void;
}) {
  return (
    <footer className={`${quizChromeFooterClass} sticky bottom-0 z-20 bg-white/95 backdrop-blur`}>
      <div className="mx-auto flex h-full max-w-3xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={onExitQuiz} className="text-zinc-500 hover:text-zinc-900">
          <Home className="size-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <Button onClick={onSubmitQuiz}>Submit quiz</Button>
      </div>
    </footer>
  );
}
