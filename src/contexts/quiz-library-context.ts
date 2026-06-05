import { createContext } from "react";
import type { InvalidQuizReport, QuizSource } from "@/types/quiz";

export type Notice = {
  kind: "success" | "error";
  text: string;
};

export type QuizLibraryContextValue = {
  directoryPath: string | null;
  directoryAvailable: boolean;
  quizzes: QuizSource[];
  invalidReports: InvalidQuizReport[];
  notice: Notice | null;
  isLoading: boolean;
  chooseWorkingDirectory: () => Promise<void>;
  refresh: () => Promise<void>;
  importQuizzes: () => Promise<void>;
  deleteQuiz: (source: QuizSource) => Promise<void>;
  clearNotice: () => void;
};

export const QuizLibraryContext = createContext<QuizLibraryContextValue | null>(null);
