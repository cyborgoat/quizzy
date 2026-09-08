import { createContext } from "react";
import type { InvalidQuizReport, QuizSource } from "@/types/quiz";

export type QuizLibraryRefreshOptions = {
  background?: boolean;
};

export type QuizLibraryContextValue = {
  directoryPath: string | null;
  directoryAvailable: boolean;
  quizzes: QuizSource[];
  invalidReports: InvalidQuizReport[];
  isLoading: boolean;
  refresh: (options?: QuizLibraryRefreshOptions) => Promise<void>;
  importQuizFile: (sourcePath: string) => Promise<string>;
  setQuizArchived: (quizId: string, archived: boolean) => Promise<boolean>;
  deleteQuizFile: (fileName: string) => Promise<boolean>;
  openQuizFolder: () => Promise<void>;
};

export const QuizLibraryContext = createContext<QuizLibraryContextValue | null>(null);
