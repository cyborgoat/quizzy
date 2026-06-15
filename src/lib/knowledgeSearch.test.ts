import { beforeEach, describe, expect, it } from "vitest";
import {
  getKnowledgeSearchIndex,
  resetKnowledgeSearchIndexCache,
  searchKnowledgeItems,
} from "@/lib/knowledgeSearch";
import type { KnowledgeItem } from "@/types/knowledge";

function makeItem(
  overrides: Partial<KnowledgeItem> & Pick<KnowledgeItem, "id" | "title">,
): KnowledgeItem {
  return {
    tags: [],
    linkedQuizQuestions: [],
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
    fileName: `${overrides.id}.md`,
    content: "",
    ...overrides,
  };
}

describe("searchKnowledgeItems", () => {
  beforeEach(() => {
    resetKnowledgeSearchIndexCache();
  });
  const items: KnowledgeItem[] = [
    makeItem({
      id: "title-hit",
      title: "React Hooks",
      content: "General programming notes.",
    }),
    makeItem({
      id: "content-hit",
      title: "State management",
      content: "This note explains react hooks in depth.",
    }),
    makeItem({
      id: "tag-hit",
      title: "Patterns",
      tags: ["react"],
      content: "Composition patterns.",
    }),
    makeItem({
      id: "other",
      title: "Vue basics",
      content: "Intro to Vue.",
      tags: ["vue"],
    }),
  ];

  it("returns all items when the query is empty", () => {
    expect(searchKnowledgeItems(items, "").map((item) => item.id)).toEqual([
      "title-hit",
      "content-hit",
      "tag-hit",
      "other",
    ]);
  });

  it("ranks title matches above content-only matches", () => {
    const ranked = searchKnowledgeItems(items, "react").map((item) => item.id);
    expect(ranked[0]).toBe("title-hit");
    expect(ranked).toContain("content-hit");
    expect(ranked).toContain("tag-hit");
    expect(ranked).not.toContain("other");
  });

  it("filters by tag before searching", () => {
    const ranked = searchKnowledgeItems(items, "react", { tagFilter: "vue" }).map(
      (item) => item.id,
    );
    expect(ranked).toEqual([]);
  });

  it("returns tag-filtered items when the query is empty", () => {
    const ranked = searchKnowledgeItems(items, "", { tagFilter: "vue" }).map(
      (item) => item.id,
    );
    expect(ranked).toEqual(["other"]);
  });

  it("limits the number of results", () => {
    const ranked = searchKnowledgeItems(items, "react", { limit: 2 });
    expect(ranked).toHaveLength(2);
  });

  it("matches multi-word queries across terms", () => {
    const ranked = searchKnowledgeItems(items, "react hooks").map((item) => item.id);
    expect(ranked[0]).toBe("title-hit");
    expect(ranked).toContain("content-hit");
  });

  it("reuses the cached search index for the same items array", () => {
    const first = getKnowledgeSearchIndex(items);
    const second = getKnowledgeSearchIndex(items);
    expect(first).toBe(second);
  });
});
