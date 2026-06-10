import { KnowledgeLibraryContext } from "@/contexts/knowledge-library-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useKnowledgeLibrary = createContextHook(
  KnowledgeLibraryContext,
  "KnowledgeLibraryProvider",
);
