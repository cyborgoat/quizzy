import { describe, expect, it } from "vitest";
import {
  filterMistakeEntries,
  resolveActiveMistakeEntry,
  resolveScopedEmptyReason,
} from "@/lib/mistakeLogDisplay";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { QuizSource } from "@/types/quiz";

const entry = (overrides: Partial<MistakeEntry> = {}): MistakeEntry => ({
  quizId: "quiz-1",
  quizTitle: "Quiz One",
  questionId: "q1",
  prompt: "Question 1",
  mistakeCount: 2,
  flaggedCount: 0,
  totalAttempts: 3,
  correctCount: 1,
  correctnessPercentage: 33,
  lastMistakenAt: "2026-01-01T10:00:00.000Z",
  lastFlaggedAt: null,
  ...overrides,
});

const quizzes: QuizSource[] = [
  {
    fileName: "quiz-1.json",
    quiz: {
      id: "quiz-1",
      title: "Quiz One",
      questions: [
        {
          id: "q1",
          type: "single_choice",
          prompt: "Question 1",
          options: ["A", "B"],
          correctIndex: 0,
        },
        {
          id: "q2",
          type: "true_false",
          prompt: "Question 2",
          correctAnswer: true,
        },
      ],
    },
  },
];

describe("mistakeLogDisplay", () => {
  it("filters entries by quiz and question type", () => {
    const entries = [
      entry({ questionId: "q1" }),
      entry({ quizId: "quiz-2", quizTitle: "Quiz Two", questionId: "q9" }),
      entry({ questionId: "q2", mistakeCount: 1 }),
    ];

    expect(
      filterMistakeEntries(entries, {
        isQuizScoped: false,
        quizFilter: "quiz-1",
        questionTypeFilter: "single_choice",
        quizzes,
      }),
    ).toEqual([entries[0]]);
  });

  it("resolves the selected entry or falls back to the first sorted row", () => {
    const entries = [entry({ questionId: "q1" }), entry({ questionId: "q2" })];

    expect(resolveActiveMistakeEntry(entries, null)).toBe(entries[0]);
    expect(resolveActiveMistakeEntry(entries, "quiz-1:q2")).toBe(entries[1]);
    expect(resolveActiveMistakeEntry(entries, "missing")).toBe(entries[0]);
    expect(resolveActiveMistakeEntry([], "quiz-1:q1")).toBeNull();
  });

  it("returns a filter-specific empty reason when filters hide all rows", () => {
    expect(
      resolveScopedEmptyReason({
        filteredCount: 0,
        isQuizScoped: false,
        quizFilter: "quiz-2",
        questionTypeFilter: "all",
        goals: [],
        rawEntries: [entry()],
        globalEmptyReason: null,
      }),
    ).toBe("no_mistakes");
  });

  it("uses the global empty reason when no filters are active", () => {
    expect(
      resolveScopedEmptyReason({
        filteredCount: 0,
        isQuizScoped: false,
        quizFilter: "all",
        questionTypeFilter: "all",
        goals: [],
        rawEntries: [],
        globalEmptyReason: "no_attempts",
      }),
    ).toBe("no_attempts");
  });
});
