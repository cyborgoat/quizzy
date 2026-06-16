import { createContext } from "react";
import type { QuizSessionMode } from "@/types/quizSession";

export type QuizStartRequest = {
  quizId: string;
  defaultMode: QuizSessionMode;
  from?: "home" | "goals";
};

export type QuizStartDialogContextValue = {
  openQuizStart: (request: QuizStartRequest) => void;
  closeQuizStart: () => void;
};

export const QuizStartDialogContext = createContext<QuizStartDialogContextValue | null>(null);
