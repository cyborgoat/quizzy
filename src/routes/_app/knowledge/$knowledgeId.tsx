import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeDetailPage } from "@/pages/KnowledgeDetailPage";

type KnowledgeDetailSearch = {
  edit?: string;
};

function knowledgeDetailSearchSchema(search: Record<string, unknown>): KnowledgeDetailSearch {
  return {
    edit: typeof search.edit === "string" ? search.edit : undefined,
  };
}

export const Route = createFileRoute("/_app/knowledge/$knowledgeId")({
  validateSearch: knowledgeDetailSearchSchema,
  component: KnowledgeDetailPage,
});
