import { describe, expect, it } from "vitest";
import type { HubItem } from "@/lib/native";
import {
  filterHubItems,
  groupHubDomains,
  REMOVED_HUB_CATEGORY,
  installedFileNames,
  isDownloadable,
  summarizeHubReport,
} from "@/lib/quizhub";

function item(overrides: Partial<HubItem>): HubItem {
  return {
    kind: "quiz",
    id: "q",
    category: "ai",
    title: "Quiz",
    tags: [],
    size: 10,
    fileName: "q.json",
    state: "available",
    ...overrides,
  };
}

describe("quizhub helpers", () => {
  it("groups items by category in manifest order with counts", () => {
    const grouped = groupHubDomains(
      [
        { id: "social", title: "行为科学" },
        { id: "cs", title: "计算机科学" },
      ],
      [
        { id: "ai", title: "人工智能", domain: "cs" },
        { id: "psychology", title: "心理学", domain: "social" },
      ],
      [
        item({ id: "n", kind: "note", title: "A note", state: "installed" }),
        item({ id: "b", title: "B quiz", state: "updateAvailable" }),
        item({ id: "a", title: "A quiz" }),
        item({ id: "x", category: "legacy", state: "removedRemotely" }),
      ],
    );
    expect(grouped.domains.map((group) => group.title)).toEqual(["行为科学", "计算机科学"]);
    const ai = grouped.domains[1].categories[0];
    expect(ai.title).toBe("人工智能");
    expect(ai.items.map((entry) => entry.id)).toEqual(["a", "b", "n"]);
    expect(ai).toMatchObject({ quizCount: 2, noteCount: 1, downloadedCount: 2, updateCount: 1 });
    expect(grouped.domains[0].categories[0].items).toEqual([]);
    expect(grouped.removed?.id).toBe(REMOVED_HUB_CATEGORY);
    expect(grouped.removed?.items.map((entry) => entry.id)).toEqual(["x"]);
  });

  it("only treats safe states as downloadable", () => {
    expect(isDownloadable("available")).toBe(true);
    expect(isDownloadable("updateAvailable")).toBe(true);
    expect(isDownloadable("installed")).toBe(false);
  });

  it("filters by title, id and tag", () => {
    const items = [
      item({ id: "ml", title: "Machine Learning", tags: ["fundamentals"] }),
      item({ id: "cog", title: "Cognition" }),
    ];
    expect(filterHubItems(items, "learn").map((entry) => entry.id)).toEqual(["ml"]);
    expect(filterHubItems(items, "FUND").map((entry) => entry.id)).toEqual(["ml"]);
    expect(filterHubItems(items, "cog").map((entry) => entry.id)).toEqual(["cog"]);
    expect(filterHubItems(items, " ")).toHaveLength(2);
  });

  it("summarizes download reports", () => {
    expect(
      summarizeHubReport({ added: 2, updated: 0, unchanged: 1, skipped: 1, failed: 0, outcomes: [] }),
    ).toBe("2 added, 1 already up to date, 1 skipped");
    expect(
      summarizeHubReport({ added: 0, updated: 0, unchanged: 0, skipped: 0, failed: 0, outcomes: [] }),
    ).toBe("Nothing to do");
  });

  it("splits installed file names by kind", () => {
    const { quizzes, notes } = installedFileNames([
      { kind: "quiz", id: "q", fileName: "q.json", category: "ai" },
      { kind: "note", id: "n", fileName: "n.md", category: "ai" },
    ]);
    expect([...quizzes]).toEqual(["q.json"]);
    expect([...notes]).toEqual(["n.md"]);
  });
});
