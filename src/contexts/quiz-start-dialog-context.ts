import { createContext } from "react";

export type QuizStartRequest = {
  quizId: string;
  from?: "home" | "goals";
};

export type QuizStartDialogContextValue = {
  openQuizStart: (request: QuizStartRequest) => void;
  closeQuizStart: () => void;
};

export const QuizStartDialogContext = createContext<QuizStartDialogContextValue | null>(null);
