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
        <div className="flex h-full items-center gap-1.5 px-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <SidebarTrigger
            className="size-8 shrink-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Toggle question sidebar"
          />
          <h2 className="truncate text-sm font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Questions
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
          aria-label={`${answeredCount} of ${total} questions answered, ${unansweredCount} left`}
        >
          <div className="flex items-center justify-between gap-3 text-xs">
            <p className="tabular-nums text-zinc-500">
              <span className="text-sm font-semibold text-zinc-950">{answeredCount}</span>
              {" of "}
              <span className="font-medium text-zinc-700">{total}</span>
              {" answered"}
            </p>
            <p className="shrink-0 tabular-nums text-zinc-500">
              <span className="font-semibold text-zinc-950">{unansweredCount}</span>
              {" left"}
            </p>
          </div>
          <Progress value={progress} className="h-1" />
          {flaggedCount > 0 && (
            <p className="inline-flex items-center gap-1 text-xs text-amber-700">
              <Flag className="size-3" aria-hidden="true" />
              {flaggedCount} flagged for review
            </p>
          )}
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
