import { useContext } from "react";
import { KnowledgeLibraryContext } from "@/contexts/knowledge-library-context";

export function useKnowledgeLibrary() {
  const context = useContext(KnowledgeLibraryContext);
  if (!context) {
    throw new Error("useKnowledgeLibrary must be used within KnowledgeLibraryProvider.");
  }
  return context;
}
