import MiniSearch from "minisearch";
import {
  buildMiniSearchIndex,
  MiniSearchIndexCache,
  searchRankedByIndex,
} from "@/lib/miniSearchLibrary";
import type { KnowledgeItem } from "@/types/knowledge";

export type KnowledgeSearchDocument = {
  id: string;
  title: string;
  tags: string;
  content: string;
};

export const KNOWLEDGE_SEARCH_FIELD_BOOST = {
  title: 3,
  tags: 2,
  content: 1,
} as const;

const indexCache = new MiniSearchIndexCache<KnowledgeSearchDocument>();

function toSearchDocument(item: KnowledgeItem): KnowledgeSearchDocument {
  return {
    id: item.id,
    title: item.title,
    tags: item.tags.join(" "),
    content: item.content,
  };
}

export function createKnowledgeSearchIndex(items: KnowledgeItem[]) {
  return buildMiniSearchIndex(
    items.map(toSearchDocument),
    ["title", "tags", "content"],
    KNOWLEDGE_SEARCH_FIELD_BOOST,
  );
}

export function getKnowledgeSearchIndex(items: KnowledgeItem[]) {
  return indexCache.get(items, createKnowledgeSearchIndex);
}

export function resetKnowledgeSearchIndexCache() {
  indexCache.reset();
}

function filterByTag(items: KnowledgeItem[], tagFilter: string) {
  if (tagFilter === "all") return items;
  return items.filter((item) => item.tags.includes(tagFilter));
}

export function searchKnowledgeItems(
  items: KnowledgeItem[],
  query: string,
  options?: {
    tagFilter?: string;
    limit?: number;
    index?: MiniSearch<KnowledgeSearchDocument>;
  },
): KnowledgeItem[] {
  const tagFilter = options?.tagFilter ?? "all";
  const tagMatches = filterByTag(items, tagFilter);
  const normalized = query.trim();

  if (!normalized) {
    return tagMatches;
  }

  const index = options?.index ?? getKnowledgeSearchIndex(items);
  const allowedIds = new Set(tagMatches.map((item) => item.id));

  return searchRankedByIndex(
    items,
    normalized,
    index as MiniSearch<{ id: string }>,
    { allowedIds, limit: options?.limit },
  );
}
