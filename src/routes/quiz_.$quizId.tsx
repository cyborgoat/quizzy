import { createFileRoute } from "@tanstack/react-router";
import { QuizPage } from "@/pages/QuizPage";

export type QuizSearch = {
  mode?: "practice" | "scored";
  count?: number;
  from?: "home" | "goals";
};

function quizSearchSchema(search: Record<string, unknown>): QuizSearch {
  const mode = search.mode === "scored" ? "scored" : search.mode === "practice" ? "practice" : undefined;
  const from =
    search.from === "goals" ? "goals" : search.from === "home" ? "home" : undefined;

  let count: number | undefined;
  if (typeof search.count === "number" && Number.isFinite(search.count)) {
    count = Math.trunc(search.count);
  } else if (typeof search.count === "string" && search.count.trim() !== "") {
    const parsed = Number.parseInt(search.count, 10);
    if (Number.isFinite(parsed)) count = parsed;
  }

  return { mode, count, from };
}

export const Route = createFileRoute("/quiz_/$quizId")({
  validateSearch: quizSearchSchema,
  component: QuizPage,
});
