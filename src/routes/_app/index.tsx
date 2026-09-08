import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/HomePage";

export type HomeSearch = {
  details?: string;
};

function homeSearchSchema(search: Record<string, unknown>): HomeSearch {
  return {
    details: typeof search.details === "string" ? search.details : undefined,
  };
}

export const Route = createFileRoute("/_app/")({
  validateSearch: homeSearchSchema,
  component: HomePage,
});
