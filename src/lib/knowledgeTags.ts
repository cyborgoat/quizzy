import {
  buildMiniSearchIndex,
  MiniSearchIndexCache,
} from "@/lib/miniSearchLibrary";

type TagSearchDocument = {
  id: string;
  tag: string;
};

const tagIndexCache = new MiniSearchIndexCache<TagSearchDocument>();

export function collectKnowledgeTags(items: { tags: string[] }[]): string[] {
  const tags = new Set<string>();
  for (const item of items) {
    for (const tag of item.tags) {
      const trimmed = tag.trim();
      if (trimmed) tags.add(trimmed);
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function parseActiveTagFragment(tagsInput: string): {
  committed: string[];
  fragment: string;
} {
  const parts = tagsInput.split(",");
  const committed = parts
    .slice(0, -1)
    .map((part) => part.trim())
    .filter(Boolean);
  const fragment = parts[parts.length - 1]?.trimStart() ?? "";
  return { committed, fragment };
}

export function applyTagSuggestion(tagsInput: string, tag: string): string {
  const { committed } = parseActiveTagFragment(tagsInput);
  const normalized = tag.trim();
  if (!normalized) return tagsInput;

  const withoutDuplicate = committed.filter(
    (existing) => existing.toLowerCase() !== normalized.toLowerCase(),
  );
  return `${[...withoutDuplicate, normalized].join(", ")}, `;
}

function createTagSearchIndex(tags: string[]) {
  return buildMiniSearchIndex(
    tags.map((tag) => ({ id: tag, tag })),
    ["tag"],
    { tag: 1 },
  );
}

export function searchKnowledgeTags(
  allTags: string[],
  query: string,
  options?: { exclude?: Iterable<string>; limit?: number },
): string[] {
  const excludeLower = new Set(
    [...(options?.exclude ?? [])].map((tag) => tag.toLowerCase()),
  );
  const limit = options?.limit ?? 8;
  const normalized = query.trim();
  const available = allTags.filter((tag) => !excludeLower.has(tag.toLowerCase()));

  if (available.length === 0) {
    return [];
  }

  if (!normalized) {
    return available.slice(0, limit);
  }

  const index = tagIndexCache.get(allTags, createTagSearchIndex);
  const allowedIds = new Set(available);

  return index
    .search(normalized, {
      filter: (result) => allowedIds.has(String(result.id)),
    })
    .map((result) => String(result.id))
    .slice(0, limit);
}
