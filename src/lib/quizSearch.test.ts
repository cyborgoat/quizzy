import { beforeEach, describe, expect, it } from "vitest";
import {
  getQuizSearchIndex,
  resetQuizSearchIndexCache,
  searchQuizSources,
} from "@/lib/quizSearch";
import type { QuizSource } from "@/types/quiz";

function makeSource(
  overrides: Partial<QuizSource["quiz"]> & Pick<QuizSource["quiz"], "id" | "title">,
): QuizSource {
  return {
    fileName: `${overrides.id}.json`,
    quiz: {
      tags: [],
      questions: [],
      ...overrides,
    },
  };
}

describe("searchQuizSources", () => {
  beforeEach(() => {
    resetQuizSearchIndexCache();
  });

  const sources: QuizSource[] = [
    makeSource({
      id: "title-hit",
      title: "React Basics",
      description: "A short intro.",
    }),
    makeSource({
      id: "description-hit",
      title: "Frontend patterns",
      description: "Covers react basics in detail.",
    }),
    makeSource({
      id: "tag-hit",
      title: "Study list",
      tags: ["react"],
      description: "Tagged quiz.",
    }),
    makeSource({
      id: "other",
      title: "Vue intro",
      tags: ["vue"],
      description: "Another framework.",
    }),
  ];

  it("returns all quizzes when the query is empty", () => {
    expect(searchQuizSources(sources, "").map((source) => source.quiz.id)).toEqual([
      "title-hit",
      "description-hit",
      "tag-hit",
      "other",
    ]);
  });

  it("ranks title matches above description-only matches", () => {
    const ranked = searchQuizSources(sources, "react").map((source) => source.quiz.id);
    expect(ranked[0]).toBe("title-hit");
    expect(ranked).toContain("description-hit");
    expect(ranked).toContain("tag-hit");
    expect(ranked).not.toContain("other");
  });

  it("limits the number of results", () => {
    expect(searchQuizSources(sources, "react", { limit: 2 })).toHaveLength(2);
  });

  it("reuses the cached search index for the same sources array", () => {
    const first = getQuizSearchIndex(sources);
    const second = getQuizSearchIndex(sources);
    expect(first).toBe(second);
  });
});
