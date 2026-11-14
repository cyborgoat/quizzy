import { describe, expect, it } from "vitest";
import type { HubItem } from "@/lib/native";
import {
  filterHubItems,
  groupHubItems,
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
    const groups = groupHubItems(
      [
        { id: "psychology", title: "Psychology" },
        { id: "ai", title: "AI" },
      ],
      [
        item({ id: "n", kind: "note", title: "A note", state: "installed" }),
        item({ id: "b", title: "B quiz", state: "updateAvailable" }),
        item({ id: "a", title: "A quiz" }),
        item({ id: "x", category: "legacy", state: "removedRemotely" }),
      ],
    );
    expect(groups.map((group) => group.id)).toEqual(["psychology", "ai", "legacy"]);
    const ai = groups[1];
    expect(ai.items.map((entry) => entry.id)).toEqual(["a", "b", "n"]);
    expect(ai).toMatchObject({ quizCount: 2, noteCount: 1, downloadedCount: 2, updateCount: 1 });
    expect(groups[0].items).toEqual([]);
  });

  it("only treats safe states as downloadable", () => {
    expect(isDownloadable("available")).toBe(true);
    expect(isDownloadable("updateAvailable")).toBe(true);
    expect(isDownloadable("modifiedLocally")).toBe(false);
    expect(isDownloadable("nameTaken")).toBe(false);
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
