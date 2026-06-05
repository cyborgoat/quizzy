import { Check, Flag } from "lucide-react";
import {
  quizChromeFooterClass,
  quizChromeHeaderClass,
} from "@/components/quiz/quiz-chrome";
import { QuestionNavigator } from "@/components/quiz/QuestionNavigator";
import { Button } from "@/components/ui/button";
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
  onSubmitQuiz,
}: {
  questions: QuizQuestion[];
  attempts: Record<string, QuestionAttempt>;
  currentIndex: number;
  answeredCount: number;
  flaggedCount: number;
  onSelectQuestion: (index: number) => void;
  onSubmitQuiz: () => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  function selectQuestion(index: number) {
    onSelectQuestion(index);
    if (isMobile) setOpenMobile(false);
  }

  function submitQuiz() {
    if (isMobile) setOpenMobile(false);
    onSubmitQuiz();
  }

  const unansweredCount = questions.length - answeredCount;

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader className={`gap-0 p-0 ${quizChromeHeaderClass}`}>
        <div className="flex h-full items-center gap-1 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <SidebarTrigger
            className="size-8 shrink-0 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Toggle question sidebar"
          />
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <h2 className="truncate text-sm font-semibold text-sidebar-foreground">Questions</h2>
            <p className="text-xs text-zinc-500">
              {answeredCount} of {questions.length} answered
            </p>
          </div>
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
        className={`flex flex-col justify-center gap-1.5 p-2 ${quizChromeFooterClass}`}
      >
        <div className="flex items-center justify-between px-1 text-xs text-zinc-500 group-data-[collapsible=icon]:hidden">
          <span>{unansweredCount} unanswered</span>
          {flaggedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Flag className="size-3" aria-hidden="true" />
              {flaggedCount}
            </span>
          )}
        </div>
        <Button
          className="w-full group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
          onClick={submitQuiz}
          aria-label="Submit quiz"
        >
          <span className="group-data-[collapsible=icon]:hidden">Submit quiz</span>
          <Check className="hidden size-4 group-data-[collapsible=icon]:block" />
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
