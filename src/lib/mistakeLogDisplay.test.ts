import { describe, expect, it } from "vitest";
import {
  buildMistakeQuizFilterOptions,
  describeFilteredEmptyMistakes,
  filterMistakeEntries,
  resolveActiveMistakeEntry,
} from "@/lib/mistakeLogDisplay";
import type { Goal } from "@/types/goal";
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
    archived: false,
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

  it("keeps a selected quiz without qualifying mistakes in the filter options", () => {
    const options = buildMistakeQuizFilterOptions({
      quizzesWithMistakes: [{ quizId: "quiz-2", quizTitle: "Quiz Two" }],
      quizFilter: "quiz-1",
      quizzes,
      goals: [],
    });

    expect(options).toEqual([
      { value: "all", label: "All quizzes" },
      { value: "quiz-1", label: "Quiz One" },
      { value: "quiz-2", label: "Quiz Two" },
    ]);
  });

  it("explains why a filtered quiz has no mistakes", () => {
    const base = {
      qualifyingEntries: [],
      rawEntries: [],
      goals: [],
      quizzes,
    };
    const attempted: Goal = {
      id: "goal-1",
      quizId: "quiz-1",
      quizTitle: "Quiz One",
      description: "",
      createdAt: "2026-01-01T00:00:00.000Z",
      attempts: [
        {
          id: "a1",
          takenAt: "2026-01-01T00:00:00.000Z",
          score: 1,
          total: 2,
          percentage: 50,
          incorrectCount: 1,
        },
      ],
    };

    expect(describeFilteredEmptyMistakes({ ...base, quizFilter: "quiz-1" })).toBe(
      "Quiz One has no scored attempts yet.",
    );
    expect(
      describeFilteredEmptyMistakes({ ...base, quizFilter: "quiz-1", goals: [attempted] }),
    ).toBe("Quiz One has no mistakes or flagged questions.");
    expect(
      describeFilteredEmptyMistakes({
        ...base,
        quizFilter: "quiz-1",
        goals: [attempted],
        rawEntries: [entry()],
      }),
    ).toBe("None of the mistakes in Quiz One meet your current thresholds.");
  });

  it("falls back to a generic message for other filters", () => {
    expect(
      describeFilteredEmptyMistakes({
        quizFilter: "quiz-1",
        qualifyingEntries: [entry()],
        rawEntries: [entry()],
        goals: [],
        quizzes,
      }),
    ).toBe("No mistakes match the current filters.");
    expect(
      describeFilteredEmptyMistakes({
        quizFilter: "all",
        qualifyingEntries: [entry()],
        rawEntries: [entry()],
        goals: [],
        quizzes,
      }),
    ).toBe("No mistakes match the current filters.");
  });
});
