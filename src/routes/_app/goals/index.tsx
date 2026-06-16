import { createFileRoute } from "@tanstack/react-router";
import { GoalsPage } from "@/pages/GoalsPage";

type GoalsSearch = {
  expand?: string;
  startQuiz?: string;
  from?: "home" | "goals";
};

function goalsSearchSchema(search: Record<string, unknown>): GoalsSearch {
  const from =
    search.from === "goals" ? "goals" : search.from === "home" ? "home" : undefined;

  return {
    expand: typeof search.expand === "string" ? search.expand : undefined,
    startQuiz: typeof search.startQuiz === "string" ? search.startQuiz : undefined,
    from,
  };
}

export const Route = createFileRoute("/_app/goals/")({
  validateSearch: goalsSearchSchema,
  component: GoalsPage,
});
