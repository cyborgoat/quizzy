import MiniSearch from "minisearch";
import {
  buildMiniSearchIndex,
  MiniSearchIndexCache,
  searchRankedByIndex,
} from "@/lib/miniSearchLibrary";
import type { QuizSource } from "@/types/quiz";

export type QuizSearchDocument = {
  id: string;
  title: string;
  description: string;
  tags: string;
};

export const QUIZ_SEARCH_FIELD_BOOST = {
  title: 3,
  tags: 2,
  description: 1,
} as const;

const indexCache = new MiniSearchIndexCache<QuizSearchDocument>();

function toSearchDocument(source: QuizSource): QuizSearchDocument {
  return {
    id: source.quiz.id,
    title: source.quiz.title,
    description: source.quiz.description ?? "",
    tags: source.quiz.tags.join(" "),
  };
}

export function createQuizSearchIndex(sources: QuizSource[]) {
  return buildMiniSearchIndex(
    sources.map(toSearchDocument),
    ["title", "description", "tags"],
    QUIZ_SEARCH_FIELD_BOOST,
  );
}

export function getQuizSearchIndex(sources: QuizSource[]) {
  return indexCache.get(sources, createQuizSearchIndex);
}

export function resetQuizSearchIndexCache() {
  indexCache.reset();
}

export function searchQuizSources(
  sources: QuizSource[],
  query: string,
  options?: {
    limit?: number;
    index?: MiniSearch<QuizSearchDocument>;
  },
): QuizSource[] {
  const normalized = query.trim();

  if (!normalized) {
    return sources;
  }

  const index = options?.index ?? getQuizSearchIndex(sources);
  const entries = sources.map((source) => ({ id: source.quiz.id, source }));
  const ranked = searchRankedByIndex(
    entries,
    normalized,
    index as MiniSearch<{ id: string }>,
    { limit: options?.limit },
  );

  return ranked.map((entry) => entry.source);
}
