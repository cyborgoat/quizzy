import { useContext } from "react";
import { QuizLibraryContext } from "@/contexts/quiz-library-context";

export function useQuizLibrary() {
  const context = useContext(QuizLibraryContext);
  if (!context) {
    throw new Error("useQuizLibrary must be used within QuizLibraryProvider.");
  }
  return context;
}
