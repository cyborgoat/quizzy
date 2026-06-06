import { createContext } from "react";
import type { InvalidQuizReport, QuizSource } from "@/types/quiz";

export type QuizLibraryContextValue = {
  directoryPath: string | null;
  directoryAvailable: boolean;
  quizzes: QuizSource[];
  invalidReports: InvalidQuizReport[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  importQuizzes: () => Promise<void>;
  deleteQuiz: (source: QuizSource) => Promise<void>;
};

export const QuizLibraryContext = createContext<QuizLibraryContextValue | null>(null);
