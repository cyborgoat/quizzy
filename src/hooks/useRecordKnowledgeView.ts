import { useEffect, useRef } from "react";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { isUnsavedKnowledgeDraft } from "@/lib/knowledgeDraft";
import type { KnowledgeItem } from "@/types/knowledge";

export function useRecordKnowledgeView(item: KnowledgeItem, enabled: boolean) {
  const { recordView } = useKnowledgeLibrary();
  const recordedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || isUnsavedKnowledgeDraft(item)) {
      return;
    }
    if (recordedIdRef.current === item.id) {
      return;
    }
    recordedIdRef.current = item.id;
    void recordView(item.id);
  }, [enabled, item, recordView]);
}
