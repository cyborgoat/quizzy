import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeBasePage } from "@/pages/KnowledgeBasePage";

type KnowledgeSearch = {
  tag?: string;
};

function knowledgeSearchSchema(search: Record<string, unknown>): KnowledgeSearch {
  return {
    tag: typeof search.tag === "string" ? search.tag : undefined,
  };
}

export const Route = createFileRoute("/_app/knowledge/")({
  validateSearch: knowledgeSearchSchema,
  component: KnowledgeBasePage,
});
