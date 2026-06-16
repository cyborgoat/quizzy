import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuizStartDialog } from "@/contexts/QuizStartDialogContext";
import type { QuizSessionMode } from "@/types/quizSession";

export function useQuizStartFromSearch(options: {
  startQuiz?: string;
  from?: "home" | "goals";
  defaultMode: QuizSessionMode;
  clearSearch: Record<string, unknown>;
  clearTo: "/goals" | "/";
}) {
  const { startQuiz, from, defaultMode, clearSearch, clearTo } = options;
  const navigate = useNavigate();
  const { openQuizStart } = useQuizStartDialog();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!startQuiz) {
      handledRef.current = null;
      return;
    }
    if (handledRef.current === startQuiz) return;
    handledRef.current = startQuiz;

    openQuizStart({
      quizId: startQuiz,
      defaultMode,
      from,
    });

    void navigate({
      to: clearTo,
      search: clearSearch,
      replace: true,
    });
  }, [startQuiz, from, defaultMode, clearSearch, clearTo, openQuizStart, navigate]);
}
