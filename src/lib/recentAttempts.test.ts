import { describe, expect, it } from "vitest";
import { collectRecentAttempts } from "@/lib/recentAttempts";
import type { Goal } from "@/types/goal";

function makeGoal(
  id: string,
  quizTitle: string,
  attempts: Goal["attempts"],
): Goal {
  return {
    id,
    quizId: `quiz-${id}`,
    quizTitle,
    description: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    completed: false,
    attempts,
  };
}

describe("collectRecentAttempts", () => {
  it("returns attempts sorted by takenAt descending across goals", () => {
    const goals = [
      makeGoal("goal-a", "Alpha Quiz", [
        {
          id: "attempt-a1",
          takenAt: "2026-06-01T10:00:00.000Z",
          score: 4,
          total: 5,
          percentage: 80,
          incorrectCount: 1,
        },
      ]),
      makeGoal("goal-b", "Beta Quiz", [
        {
          id: "attempt-b1",
          takenAt: "2026-06-10T10:00:00.000Z",
          score: 9,
          total: 10,
          percentage: 90,
          incorrectCount: 1,
        },
        {
          id: "attempt-b0",
          takenAt: "2026-05-01T10:00:00.000Z",
          score: 7,
          total: 10,
          percentage: 70,
          incorrectCount: 3,
        },
      ]),
    ];

    const recent = collectRecentAttempts(goals);

    expect(recent.map((entry) => entry.attemptId)).toEqual([
      "attempt-b1",
      "attempt-a1",
      "attempt-b0",
    ]);
    expect(recent[0]?.quizTitle).toBe("Beta Quiz");
  });

  it("limits the number of returned attempts", () => {
    const goals = [
      makeGoal("goal-a", "Alpha Quiz", [
        {
          id: "attempt-1",
          takenAt: "2026-06-03T10:00:00.000Z",
          score: 1,
          total: 1,
          percentage: 100,
          incorrectCount: 0,
        },
        {
          id: "attempt-2",
          takenAt: "2026-06-02T10:00:00.000Z",
          score: 0,
          total: 1,
          percentage: 0,
          incorrectCount: 1,
        },
      ]),
    ];

    expect(collectRecentAttempts(goals, 1)).toHaveLength(1);
    expect(collectRecentAttempts(goals, 1)[0]?.attemptId).toBe("attempt-1");
  });
});
