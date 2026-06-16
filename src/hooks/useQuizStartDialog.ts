import { QuizStartDialogContext } from "@/contexts/quiz-start-dialog-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useQuizStartDialog = createContextHook(
  QuizStartDialogContext,
  "QuizStartDialogProvider",
);
