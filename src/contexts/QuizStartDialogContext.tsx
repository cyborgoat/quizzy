import { useCallback, useMemo, useState, type ReactNode } from "react";
import { QuizStartDialog } from "@/components/quiz/QuizStartDialog";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import {
  QuizStartDialogContext,
  type QuizStartRequest,
} from "@/contexts/quiz-start-dialog-context";

export function QuizStartDialogProvider({ children }: { children: ReactNode }) {
  const { quizzes } = useQuizLibrary();
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
        <QuizStartDialog
          key={`${request.quizId}-${request.defaultMode}`}
          open
          onOpenChange={(open) => {
            if (!open) closeQuizStart();
          }}
          quiz={quiz}
          defaultMode={request.defaultMode}
          from={request.from}
        />
      )}
    </QuizStartDialogContext.Provider>
  );
}
