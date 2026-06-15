import MiniSearch from "minisearch";

export type MiniSearchFieldBoost = Record<string, number>;

export const MINI_SEARCH_DEFAULTS = {
  fuzzy: 0.2,
  prefix: true,
} as const;

export function buildMiniSearchIndex<T extends Record<string, unknown>>(
  documents: T[],
  fields: (keyof T & string)[],
  boost: MiniSearchFieldBoost,
) {
  const index = new MiniSearch<T>({
    fields: fields as string[],
    storeFields: ["id"],
    searchOptions: {
      boost,
      ...MINI_SEARCH_DEFAULTS,
    },
  });
  index.addAll(documents);
  return index;
}

export class MiniSearchIndexCache<TDoc extends Record<string, unknown> & { id: string }> {
  private cachedSource: unknown[] | null = null;
  private cachedIndex: MiniSearch<TDoc> | null = null;

  get<TSource>(
    sourceItems: TSource[],
    build: (items: TSource[]) => MiniSearch<TDoc>,
  ): MiniSearch<TDoc> {
    if (this.cachedSource === sourceItems && this.cachedIndex !== null) {
      return this.cachedIndex;
    }

    this.cachedSource = sourceItems as unknown[];
    this.cachedIndex = build(sourceItems);
    return this.cachedIndex;
  }

  reset() {
    this.cachedSource = null;
    this.cachedIndex = null;
  }
}

export function searchRankedByIndex<TItem extends { id: string }>(
  items: TItem[],
  query: string,
  index: MiniSearch<{ id: string }>,
  options?: { allowedIds?: Set<string>; limit?: number },
): TItem[] {
  const normalized = query.trim();
  const allowedIds = options?.allowedIds;

  if (!normalized) {
    return allowedIds ? items.filter((item) => allowedIds.has(item.id)) : items;
  }

  const itemById = new Map(items.map((item) => [item.id, item]));
  const results = index.search(normalized, {
    filter: allowedIds
      ? (result) => allowedIds.has(String(result.id))
      : undefined,
  });

  const ranked = results
    .map((result) => itemById.get(String(result.id)))
    .filter((item): item is TItem => item !== undefined);

  if (options?.limit !== undefined) {
    return ranked.slice(0, options.limit);
  }

  return ranked;
}
