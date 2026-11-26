import { Flag } from "lucide-react";
import {
  quizChromeFooterClass,
  quizChromeHeaderClass,
} from "@/components/quiz/quiz-chrome";
import { QuestionNavigator } from "@/components/quiz/QuestionNavigator";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import type { QuestionAttempt, QuizQuestion } from "@/types/quiz";
import { useI18n } from "@/lib/i18n";
import { RichText } from "@/components/ui/rich-text";

export function QuizQuestionSidebar({
  questions,
  attempts,
  currentIndex,
  answeredCount,
  flaggedCount,
  onSelectQuestion,
}: {
  questions: QuizQuestion[];
  attempts: Record<string, QuestionAttempt>;
  currentIndex: number;
  answeredCount: number;
  flaggedCount: number;
  onSelectQuestion: (index: number) => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { t } = useI18n();


  function selectQuestion(index: number) {
    onSelectQuestion(index);
    if (isMobile) setOpenMobile(false);
  }

  const total = questions.length;
  const unansweredCount = total - answeredCount;
  const progress = total > 0 ? (answeredCount / total) * 100 : 0;

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader className={`gap-0 p-0 ${quizChromeHeaderClass}`}>
        <div className="flex h-full items-center gap-2 px-1">
          <SidebarTrigger tooltipSide="left" />
          <h2 className="truncate text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            {t("quiz.sidebar.title")}
          </h2>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        <QuestionNavigator
          questions={questions}
          attempts={attempts}
          currentIndex={currentIndex}
          onSelectQuestion={selectQuestion}
        />
      </SidebarContent>

      <SidebarFooter
        className={`flex flex-col justify-center px-3 py-2 ${quizChromeFooterClass}`}
      >
        <div
          className="w-full space-y-1.5 group-data-[collapsible=icon]:hidden"
          aria-label={t("quiz.sidebar.progressAria", {
            answered: answeredCount,
            total,
            left: unansweredCount,
          })}
        >
          <div className="flex items-center justify-between gap-3 text-xs">
            <p className="tabular-nums text-zinc-500">
              <RichText
                text={t("quiz.sidebar.answeredOf")}
                slots={{
                  answered: (
                    <span className="text-sm font-semibold text-zinc-950">{answeredCount}</span>
                  ),
                  total: <span className="font-medium text-zinc-700">{total}</span>,
                }}
              />
            </p>
            <p className="shrink-0 tabular-nums text-zinc-500">
              <RichText
                text={t("quiz.sidebar.left")}
                slots={{
                  count: <span className="font-semibold text-zinc-950">{unansweredCount}</span>,
                }}
              />
            </p>
          </div>
          <Progress value={progress} className="h-1" />
          {flaggedCount > 0 && (
            <p className="inline-flex items-center gap-1 text-xs text-amber-700">
              <Flag className="size-3" aria-hidden="true" />
              {t("quiz.sidebar.flagged", { count: flaggedCount })}
            </p>
          )}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
