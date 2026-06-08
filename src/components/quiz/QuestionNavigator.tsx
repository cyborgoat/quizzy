import { Flag } from "lucide-react";
import {
  groupQuestionsByType,
  QUESTION_TYPE_LABELS,
} from "@/lib/questionOrder";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { QuestionAttempt, QuizQuestion } from "@/types/quiz";

export function QuestionNavigator({
  questions,
  attempts,
  currentIndex,
  onSelectQuestion,
}: {
  questions: QuizQuestion[];
  attempts: Record<string, QuestionAttempt>;
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
}) {
  const questionIndexById = new Map(
    questions.map((question, index) => [question.id, index]),
  );
  const groups = groupQuestionsByType(questions);

  return (
    <nav aria-label="Quiz questions">
      {groups.map((group) => (
        <SidebarGroup key={group.type} className="p-0">
          <SidebarGroupLabel className="px-2">
            {QUESTION_TYPE_LABELS[group.type]}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.questions.map((question) => {
                const index = questionIndexById.get(question.id) ?? 0;
                const attempt = attempts[question.id];
                const answered = Boolean(attempt?.answer);
                const flagged = Boolean(attempt?.flagged);
                const current = index === currentIndex;
                const status = [
                  `Question ${index + 1}`,
                  question.prompt,
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
                      size="default"
                      isActive={current}
                      className="hover:bg-zinc-100 data-[active=true]:bg-zinc-200 data-[active=true]:font-medium group-data-[collapsible=icon]:justify-center"
                      aria-label={status}
                      aria-current={current ? "step" : undefined}
                      onClick={() => onSelectQuestion(index)}
                    >
                      <span
                        className={
                          answered
                            ? "grid-center size-5 shrink-0 rounded-md bg-zinc-900 text-xs font-semibold tabular-nums text-white"
                            : "grid-center size-5 shrink-0 rounded-md border border-zinc-200 bg-zinc-100 text-xs font-medium tabular-nums text-zinc-400"
                        }
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-700 group-data-[collapsible=icon]:hidden">
                        Question {index + 1}
                      </span>
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
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </nav>
  );
}
