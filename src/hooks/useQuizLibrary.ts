import { QuizLibraryContext } from "@/contexts/quiz-library-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useQuizLibrary = createContextHook(QuizLibraryContext, "QuizLibraryProvider");
