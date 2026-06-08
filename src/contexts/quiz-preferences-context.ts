import { createContext } from "react";

export type QuizPreferencesContextValue = {
  shuffleMode: boolean;
  setShuffleMode: (enabled: boolean) => void;
};

export const QuizPreferencesContext =
  createContext<QuizPreferencesContextValue | null>(null);
