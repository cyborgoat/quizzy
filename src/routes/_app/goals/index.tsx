import { createFileRoute } from "@tanstack/react-router";
import { GoalsPage } from "@/pages/GoalsPage";

type GoalsSearch = {
  expand?: string;
};

function goalsSearchSchema(search: Record<string, unknown>): GoalsSearch {
  return {
    expand: typeof search.expand === "string" ? search.expand : undefined,
  };
}

export const Route = createFileRoute("/_app/goals/")({
  validateSearch: goalsSearchSchema,
  component: GoalsPage,
});
