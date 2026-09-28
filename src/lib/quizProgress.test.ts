import { describe, expect, it } from "vitest";
import {
  filterQuizSources,
  quizProgressMetrics,
  quizProgressStatus,
  parseQuizLibrarySort,
  sortQuizSources,
  withSortField,
} from "@/lib/quizProgress";
import type { QuizSource } from "@/types/quiz";
import type { Goal } from "@/types/goal";

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    quizId: "quiz-1",
    quizTitle: "Quiz",
    description: "",
    targetScore: 80,
    createdAt: "2026-01-01T00:00:00.000Z",
    attempts: [],
    ...overrides,
  };
}

function attempt(id: string, percentage: number) {
  return {
    id,
    takenAt: "2026-01-01T00:00:00.000Z",
    score: percentage,
    total: 100,
    percentage,
    incorrectCount: 100 - percentage,
  };
}

describe("quizProgress", () => {
  it("marks quizzes without attempts as not started", () => {
    expect(quizProgressStatus(undefined)).toBe("not-started");
    expect(quizProgressStatus(goal())).toBe("not-started");
  });

  it("distinguishes in-progress and target-reached quizzes", () => {
    expect(quizProgressStatus(goal({ attempts: [attempt("a", 70)] }))).toBe("in-progress");
    expect(quizProgressStatus(goal({ attempts: [attempt("a", 85)] }))).toBe("target-reached");
  });

  it("keeps attempted quizzes without a target in progress", () => {
    expect(
      quizProgressStatus(goal({ targetScore: undefined, attempts: [attempt("a", 100)] })),
    ).toBe("in-progress");
  });

  it("calculates attempt count and highest score", () => {
    expect(quizProgressMetrics(undefined)).toEqual({ attemptCount: 0 });
    expect(
      quizProgressMetrics(goal({ attempts: [attempt("a", 40), attempt("b", 95)] })),
    ).toEqual({ attemptCount: 2, highestScore: 95 });
  });

  it("separates archived quizzes from active status filters", () => {
    const source = (id: string, archived = false): QuizSource => ({
      fileName: `${id}.json`,
      archived,
      quiz: { id, title: id, tags: [], questions: [] },
    });
    const sources = [source("new"), source("started"), source("hidden", true)];
    const goals = [goal({ quizId: "started", attempts: [attempt("a", 70)] })];

    expect(filterQuizSources(sources, goals, "all").map((item) => item.quiz.id)).toEqual([
      "new",
      "started",
    ]);
    expect(
      filterQuizSources(sources, goals, "in-progress").map((item) => item.quiz.id),
    ).toEqual(["started"]);
    expect(filterQuizSources(sources, goals, "archived").map((item) => item.quiz.id)).toEqual([
      "hidden",
    ]);
  });

  describe("sortQuizSources", () => {
    const source = (id: string, title = id): QuizSource => ({
      fileName: `${id}.json`,
      archived: false,
      quiz: { id, title, tags: [], questions: [] },
    });
    const attemptAt = (id: string, percentage: number, takenAt: string) => ({
      ...attempt(id, percentage),
      takenAt,
    });
    const sources = [
      source("untouched", "beta"),
      source("few", "Alpha"),
      source("many", "gamma"),
    ];
    const goals = [
      goal({
        id: "g-few",
        quizId: "few",
        targetScore: 90,
        attempts: [attemptAt("a", 95, "2026-03-01T00:00:00.000Z")],
      }),
      goal({
        id: "g-many",
        quizId: "many",
        targetScore: 70,
        attempts: [
          attemptAt("b", 60, "2026-04-01T00:00:00.000Z"),
          attemptAt("c", 80, "2026-02-01T00:00:00.000Z"),
        ],
      }),
    ];
    const ids = (
      field: Parameters<typeof withSortField>[0],
      direction: "asc" | "desc" = "desc",
    ) => sortQuizSources(sources, goals, { field, direction }).map((item) => item.quiz.id);

    it("keeps the incoming order by default", () => {
      expect(ids("default", "asc")).toEqual(["untouched", "few", "many"]);
      expect(ids("default", "desc")).toEqual(["untouched", "few", "many"]);
    });

    it("sorts metrics high to low", () => {
      expect(ids("recent-attempt")).toEqual(["many", "few", "untouched"]);
      expect(ids("attempts")).toEqual(["many", "few", "untouched"]);
      expect(ids("best-score")).toEqual(["few", "many", "untouched"]);
      expect(ids("target-score")).toEqual(["few", "many", "untouched"]);
    });

    it("sorts metrics low to high, keeping missing values last", () => {
      expect(ids("recent-attempt", "asc")).toEqual(["few", "many", "untouched"]);
      expect(ids("attempts", "asc")).toEqual(["untouched", "few", "many"]);
      expect(ids("best-score", "asc")).toEqual(["many", "few", "untouched"]);
      expect(ids("target-score", "asc")).toEqual(["many", "few", "untouched"]);
    });

    it("sorts titles case-insensitively in both directions", () => {
      expect(ids("title", "asc")).toEqual(["few", "untouched", "many"]);
      expect(ids("title", "desc")).toEqual(["many", "untouched", "few"]);
    });
  });

  describe("sort preferences", () => {
    it("starts each field from its natural direction", () => {
      expect(withSortField("title")).toEqual({ field: "title", direction: "asc" });
      expect(withSortField("best-score")).toEqual({ field: "best-score", direction: "desc" });
    });

    it("parses stored sorts and falls back on invalid data", () => {
      expect(parseQuizLibrarySort({ field: "attempts", direction: "asc" })).toEqual({
        field: "attempts",
        direction: "asc",
      });
      expect(parseQuizLibrarySort({ field: "attempts", direction: "sideways" })).toEqual({
        field: "attempts",
        direction: "desc",
      });
      expect(parseQuizLibrarySort({ field: "nope" })).toEqual({
        field: "default",
        direction: "asc",
      });
      expect(parseQuizLibrarySort("best-score")).toEqual({
        field: "default",
        direction: "asc",
      });
    });
  });
});
