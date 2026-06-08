import { useContext } from "react";
import { QuizPreferencesContext } from "@/contexts/quiz-preferences-context";

export function useQuizPreferences() {
  const context = useContext(QuizPreferencesContext);
  if (!context) {
    throw new Error("useQuizPreferences must be used within QuizPreferencesProvider.");
  }
  return context;
}
