import { createFileRoute } from "@tanstack/react-router";
import { MistakeLogPage } from "@/pages/MistakeLogPage";

type MistakesSearch = {
  quizId?: string;
};

function mistakesSearchSchema(search: Record<string, unknown>): MistakesSearch {
  return {
    quizId: typeof search.quizId === "string" ? search.quizId : undefined,
  };
}

export const Route = createFileRoute("/_app/mistakes/")({
  validateSearch: mistakesSearchSchema,
  component: MistakeLogPage,
});
