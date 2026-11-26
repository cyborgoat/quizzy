import { Home } from "lucide-react";
import { quizChromeFooterClass } from "@/components/quiz/quiz-chrome";
import { quizChromeInnerClass } from "@/components/layout/pageShellClasses";
import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/ui/icon-action-button";
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
        <IconActionButton icon={Home} label={t("nav.home")} onClick={onExitQuiz} />
        <Button onClick={onSubmitQuiz}>{t("common.submit")}</Button>
      </div>
    </footer>
  );
}
