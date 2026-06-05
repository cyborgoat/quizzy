import { Check, Flag } from "lucide-react";
import { QuestionNavigator } from "@/components/quiz/QuestionNavigator";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import type { QuestionAttempt, Quiz } from "@/types/quiz";

export function QuizQuestionSidebar({
  quiz,
  attempts,
  currentIndex,
  answeredCount,
  flaggedCount,
  onSelectQuestion,
  onSubmitQuiz,
}: {
  quiz: Quiz;
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

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center justify-between gap-3 group-data-[collapsible=icon]:hidden">
          <h2 className="font-semibold text-sidebar-foreground">Questions</h2>
          <span className="text-xs text-zinc-500">
            {answeredCount}/{quiz.questions.length} answered
          </span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Question navigator</SidebarGroupLabel>
          <SidebarGroupContent>
            <QuestionNavigator
              quiz={quiz}
              attempts={attempts}
              currentIndex={currentIndex}
              onSelectQuestion={selectQuestion}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="grid grid-cols-2 gap-3 text-sm group-data-[collapsible=icon]:hidden">
          <div className="rounded-lg bg-zinc-100 p-3">
            <p className="text-zinc-500">Unanswered</p>
            <p className="mt-1 font-semibold text-zinc-950">
              {quiz.questions.length - answeredCount}
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="flex items-center gap-1 text-amber-700">
              <Flag className="size-3.5" /> Flagged
            </p>
            <p className="mt-1 font-semibold text-amber-950">{flaggedCount}</p>
          </div>
        </div>
        <Button
          className="mt-2 w-full group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
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
