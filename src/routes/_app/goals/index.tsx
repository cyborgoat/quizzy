import { createFileRoute } from "@tanstack/react-router";
import { LegacyGoalsRedirectPage } from "@/pages/LegacyGoalsRedirectPage";

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
  component: LegacyGoalsRedirectPage,
});
