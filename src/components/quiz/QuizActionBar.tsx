import { Home } from "lucide-react";
import { quizChromeFooterClass } from "@/components/quiz/quiz-chrome";
import { quizChromeInnerClass } from "@/components/layout/pageShellClasses";
import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { cn } from "@/lib/utils";

export function QuizActionBar({
  onExitQuiz,
  onSubmitQuiz,
}: {
  onExitQuiz: () => void;
  onSubmitQuiz: () => void;
}) {
  return (
    <footer className={`${quizChromeFooterClass} sticky bottom-0 z-20 bg-white/95 backdrop-blur`}>
      <div className={cn(quizChromeInnerClass, "flex h-full items-center justify-between")}>
        <IconActionButton icon={Home} label="Home" onClick={onExitQuiz} />
        <Button onClick={onSubmitQuiz}>Submit</Button>
      </div>
    </footer>
  );
}
