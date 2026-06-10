import { QuizPreferencesContext } from "@/contexts/quiz-preferences-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useQuizPreferences = createContextHook(
  QuizPreferencesContext,
  "QuizPreferencesProvider",
);
