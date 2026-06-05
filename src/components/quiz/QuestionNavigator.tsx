import { Check, Flag } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { QuestionAttempt, Quiz } from "@/types/quiz";

export function QuestionNavigator({
  quiz,
  attempts,
  currentIndex,
  onSelectQuestion,
}: {
  quiz: Quiz;
  attempts: Record<string, QuestionAttempt>;
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
}) {
  return (
    <nav aria-label="Quiz questions">
      <SidebarMenu>
        {quiz.questions.map((question, index) => {
          const attempt = attempts[question.id];
          const answered = Boolean(attempt?.answer);
          const flagged = Boolean(attempt?.flagged);
          const current = index === currentIndex;
          const status = [
            `Question ${index + 1}`,
            answered ? "answered" : "unanswered",
            flagged ? "flagged for review" : "",
            current ? "current question" : "",
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <SidebarMenuItem key={question.id}>
              <SidebarMenuButton
                type="button"
                size="lg"
                isActive={current}
                tooltip={status}
                aria-label={status}
                aria-current={current ? "step" : undefined}
                onClick={() => onSelectQuestion(index)}
              >
                <span
                  className={
                    answered
                      ? "flex size-7 shrink-0 items-center justify-center rounded-md bg-zinc-900 font-semibold text-white"
                      : "flex size-7 shrink-0 items-center justify-center rounded-md border border-zinc-300 bg-white font-semibold text-zinc-700"
                  }
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <span className="block truncate font-medium">
                    Question {index + 1}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {answered ? "Answered" : "Unanswered"}
                  </span>
                </span>
                {answered && (
                  <Check
                    className="size-4 text-emerald-600 group-data-[collapsible=icon]:hidden"
                    aria-hidden="true"
                  />
                )}
              </SidebarMenuButton>
              {flagged && (
                <SidebarMenuBadge className="text-amber-700">
                  <Flag className="size-3.5" aria-label="Flagged for review" />
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
