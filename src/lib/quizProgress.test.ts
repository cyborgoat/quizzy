import { describe, expect, it } from "vitest";
import {
  filterQuizSources,
  quizProgressMetrics,
  quizProgressStatus,
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
});
