import { describe, expect, it } from "vitest";
import { quizProgressMetrics, quizProgressStatus } from "@/lib/quizProgress";
import type { Goal } from "@/types/goal";

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    quizId: "quiz-1",
    quizTitle: "Quiz",
    description: "",
    targetScore: 80,
    createdAt: "2026-01-01T00:00:00.000Z",
    completed: false,
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

  it("distinguishes in-progress, target-reached, and completed quizzes", () => {
    expect(quizProgressStatus(goal({ attempts: [attempt("a", 70)] }))).toBe("in-progress");
    expect(quizProgressStatus(goal({ attempts: [attempt("a", 85)] }))).toBe("target-reached");
    expect(
      quizProgressStatus(goal({ completed: true, attempts: [attempt("a", 70)] })),
    ).toBe("completed");
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
});
