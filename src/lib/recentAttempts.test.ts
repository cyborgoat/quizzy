import { describe, expect, it } from "vitest";
import {
  attemptHistoryStats,
  attemptLocalDateKey,
  collectAttemptHistory,
  filterAttemptHistory,
  type AttemptHistoryFilters,
} from "@/lib/recentAttempts";
import type { Goal } from "@/types/goal";
import type { QuizSource } from "@/types/quiz";

function goal(
  id: string,
  quizId: string,
  targetScore: number | undefined,
  attempts: Goal["attempts"],
): Goal {
  return {
    id,
    quizId,
    quizTitle: quizId,
    description: "",
    targetScore,
    createdAt: attempts[0]?.takenAt ?? "2026-01-01T00:00:00.000Z",
    attempts,
  };
}

function source(
  id: string,
  archived: boolean,
  title = id,
): QuizSource {
  return {
    fileName: `${id}.json`,
    archived,
    quiz: { id, title, tags: [], questions: [] },
  };
}

const attempts = [
  {
    id: "older-pass",
    takenAt: "2026-01-01T10:00:00.000Z",
    score: 8,
    total: 10,
    percentage: 80,
    incorrectCount: 2,
  },
  {
    id: "newer-fail",
    takenAt: "2026-01-03T10:00:00.000Z",
    score: 5,
    total: 10,
    percentage: 50,
    incorrectCount: 5,
  },
];

const defaultFilters: AttemptHistoryFilters = {
  query: "",
  quizId: "",
  sort: "newest",
};

describe("attempt history", () => {
  const goals = [
    goal("active-goal", "active", 70, attempts),
    goal("archived-goal", "archived", undefined, [
      {
        id: "perfect",
        takenAt: "2026-01-02T10:00:00.000Z",
        score: 10,
        total: 10,
        percentage: 100,
        incorrectCount: 0,
      },
    ]),
  ];
  const sources = [
    source("active", false, "TypeScript Basics"),
    source("archived", true, "Rust Review"),
  ];
  const entries = collectAttemptHistory(goals, sources);

  it("enriches attempts with quiz metadata and archive state", () => {
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      goalId: "active-goal",
      quizTitle: "TypeScript Basics",
      archived: false,
      quizAvailable: true,
    });
  });

  it("preserves attempt history when its quiz file is unavailable", () => {
    const unavailable = collectAttemptHistory(
      [goal("missing-goal", "missing", 80, [attempts[0]])],
      [],
    );
    expect(unavailable[0]).toMatchObject({
      quizId: "missing",
      quizTitle: "missing",
      quizAvailable: false,
      archived: false,
    });
  });

  it("sorts the unified history newest first by default", () => {
    expect(filterAttemptHistory(entries, defaultFilters).map((entry) => entry.attempt.id))
      .toEqual(["newer-fail", "perfect", "older-pass"]);
  });

  it("filters attempts by quiz ID", () => {
    expect(
      filterAttemptHistory(entries, {
        ...defaultFilters,
        quizId: "archived",
      }).map((entry) => entry.attempt.id),
    ).toEqual(["perfect"]);
  });

  it("searches quiz titles case-insensitively", () => {
    expect(
      filterAttemptHistory(entries, {
        ...defaultFilters,
        query: "typescript",
      }).map((entry) => entry.attempt.id),
    ).toEqual(["newer-fail", "older-pass"]);
  });

  it("sorts oldest first when requested", () => {
    expect(
      filterAttemptHistory(entries, {
        ...defaultFilters,
        sort: "oldest",
      }).map((entry) => entry.attempt.id),
    ).toEqual(["older-pass", "perfect", "newer-fail"]);
  });

  it("calculates rounded statistics from the filtered collection", () => {
    expect(attemptHistoryStats(entries)).toEqual({
      count: 3,
      averageScore: 77,
      bestScore: 100,
      passRate: 67,
    });
    expect(attemptHistoryStats([])).toEqual({ count: 0 });
  });

  it("creates a stable local calendar-day key", () => {
    const key = attemptLocalDateKey("2026-01-03T10:00:00.000Z");
    expect(key).toMatch(/^2026-01-0[23]$/);
  });
});
