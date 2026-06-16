import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { QuizStartDialog } from "@/components/quiz/QuizStartDialog";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import type { QuizSessionMode } from "@/types/quizSession";

export type QuizStartRequest = {
  quizId: string;
  defaultMode: QuizSessionMode;
  from?: "home" | "goals";
};

type QuizStartDialogContextValue = {
  openQuizStart: (request: QuizStartRequest) => void;
  closeQuizStart: () => void;
};

const QuizStartDialogContext = createContext<QuizStartDialogContextValue | null>(null);

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

export function useQuizStartDialog() {
  const context = useContext(QuizStartDialogContext);
  if (!context) {
    throw new Error("useQuizStartDialog must be used within QuizStartDialogProvider");
  }
  return context;
}
