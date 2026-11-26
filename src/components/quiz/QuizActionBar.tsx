import { LogOut } from "lucide-react";
import { quizChromeFooterClass } from "@/components/quiz/quiz-chrome";
import { quizChromeInnerClass } from "@/components/layout/pageShellClasses";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function QuizActionBar({
  onExitQuiz,
  onSubmitQuiz,
}: {
  onExitQuiz: () => void;
  onSubmitQuiz: () => void;
}) {
  const { t } = useI18n();

  return (
    <footer className={`${quizChromeFooterClass} sticky bottom-0 z-20 bg-white/95 backdrop-blur`}>
      <div className={cn(quizChromeInnerClass, "flex h-full items-center justify-between")}>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 px-1 text-zinc-700 hover:bg-transparent hover:text-zinc-950"
          onClick={onExitQuiz}
        >
          <LogOut className="size-4" />
          {t("quiz.quit")}
        </Button>
        <Button size="sm" onClick={onSubmitQuiz}>
          {t("common.submit")}
        </Button>
      </div>
    </footer>
  );
}
