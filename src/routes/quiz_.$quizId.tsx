import { createFileRoute } from "@tanstack/react-router";
import { QuizPage } from "@/pages/QuizPage";

export type QuizSearch = {
  from?: "home" | "goals";
};

function quizSearchSchema(search: Record<string, unknown>): QuizSearch {
  const from =
    search.from === "goals" ? "goals" : search.from === "home" ? "home" : undefined;

  return { from };
}

export const Route = createFileRoute("/quiz_/$quizId")({
  validateSearch: quizSearchSchema,
  component: QuizPage,
});
