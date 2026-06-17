import { describe, expect, it } from "vitest";
import {
  applyTagSuggestion,
  collectKnowledgeTags,
  parseActiveTagFragment,
  searchKnowledgeTags,
} from "@/lib/knowledgeTags";

describe("collectKnowledgeTags", () => {
  it("returns unique sorted tags from knowledge items", () => {
    expect(
      collectKnowledgeTags([
        { tags: ["react", "hooks"] },
        { tags: ["vue", "react"] },
      ]),
    ).toEqual(["hooks", "react", "vue"]);
  });
});

describe("parseActiveTagFragment", () => {
  it("splits committed tags from the active fragment", () => {
    expect(parseActiveTagFragment("react, hooks, jav")).toEqual({
      committed: ["react", "hooks"],
      fragment: "jav",
    });
  });

  it("treats the whole input as a fragment when there is no comma", () => {
    expect(parseActiveTagFragment("reac")).toEqual({
      committed: [],
      fragment: "reac",
    });
  });
});

describe("applyTagSuggestion", () => {
  it("replaces the active fragment and appends a trailing comma", () => {
    expect(applyTagSuggestion("react, hoo", "hooks")).toBe("react, hooks, ");
  });

  it("avoids duplicate committed tags", () => {
    expect(applyTagSuggestion("react, re", "react")).toBe("react, ");
  });
});

describe("searchKnowledgeTags", () => {
  const tags = ["react", "react-hooks", "typescript", "vue"];

  it("fuzzy-matches existing tags", () => {
    expect(searchKnowledgeTags(tags, "ract")).toEqual(["react", "react-hooks"]);
    expect(searchKnowledgeTags(tags, "hook")).toEqual(["react-hooks"]);
    expect(searchKnowledgeTags(tags, "typ")).toEqual(["typescript"]);
  });

  it("excludes already committed tags", () => {
    expect(
      searchKnowledgeTags(tags, "react", { exclude: ["react"] }),
    ).toEqual(["react-hooks"]);
  });

  it("returns available tags when the query is empty", () => {
    expect(searchKnowledgeTags(tags, "", { limit: 2 })).toEqual(["react", "react-hooks"]);
  });
});
