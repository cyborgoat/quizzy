import { useCallback, useMemo, useState, type ReactNode } from "react";
import { StartQuizDialog } from "@/components/quiz/StartQuizDialog";
import { useGoals } from "@/hooks/useGoals";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import {
  QuizStartDialogContext,
  type QuizStartRequest,
} from "@/contexts/quiz-start-dialog-context";

export function QuizStartDialogProvider({ children }: { children: ReactNode }) {
  const { quizzes } = useQuizLibrary();
  const { goals } = useGoals();
  const [request, setRequest] = useState<QuizStartRequest | null>(null);

  const quiz = useMemo(
    () => quizzes.find((source) => source.quiz.id === request?.quizId)?.quiz ?? null,
    [quizzes, request?.quizId],
  );

  const openQuizStart = useCallback((nextRequest: QuizStartRequest) => {
    setRequest(nextRequest);
  }, []);

  const closeQuizStart = useCallback(() => {
    setRequest(null);
  }, []);

  const value = useMemo(
    () => ({ openQuizStart, closeQuizStart }),
    [openQuizStart, closeQuizStart],
  );

  return (
    <QuizStartDialogContext.Provider value={value}>
      {children}
      {request && quiz && (
        <StartQuizDialog
          key={request.quizId}
          open
          quiz={quiz}
          hasGoal={goals.some((goal) => goal.quizId === request.quizId)}
          onOpenChange={(open) => {
            if (!open) closeQuizStart();
          }}
        />
      )}
    </QuizStartDialogContext.Provider>
  );
}
