import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/HomePage";

export type HomeSearch = {
  startQuiz?: string;
  from?: "home" | "goals";
};

function homeSearchSchema(search: Record<string, unknown>): HomeSearch {
  const from =
    search.from === "goals" ? "goals" : search.from === "home" ? "home" : undefined;

  return {
    startQuiz: typeof search.startQuiz === "string" ? search.startQuiz : undefined,
    from,
  };
}

export const Route = createFileRoute("/_app/")({
  validateSearch: homeSearchSchema,
  component: HomePage,
});
