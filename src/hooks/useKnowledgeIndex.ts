import { useMemo } from "react";
import { buildKnowledgeIndex } from "@/lib/knowledgeIndex";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";

export function useKnowledgeIndex() {
  const { items } = useKnowledgeLibrary();
  return useMemo(() => buildKnowledgeIndex(items), [items]);
}
