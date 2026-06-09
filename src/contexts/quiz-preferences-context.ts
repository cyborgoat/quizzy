import { createContext } from "react";

export type QuizPreferencesContextValue = {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  setShuffleQuestions: (enabled: boolean) => void;
  setShuffleOptions: (enabled: boolean) => void;
};

export const QuizPreferencesContext =
  createContext<QuizPreferencesContextValue | null>(null);
