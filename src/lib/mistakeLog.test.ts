import { describe, expect, it } from "vitest";
import {
  aggregateQuestionResults,
  buildMistakeEntries,
  detectEmptyReason,
  meetsThreshold,
  sortMistakeEntries,
} from "@/lib/mistakeLog";

describe("mistakeLog", () => {
  const attempts = [
    {
      quizId: "quiz-1",
      quizTitle: "Quiz One",
      takenAt: "2026-01-01T10:00:00.000Z",
      questionResults: [
        { questionId: "q1", prompt: "Question 1", correct: false, flagged: true },
        { questionId: "q2", prompt: "Question 2", correct: true },
      ],
    },
    {
      quizId: "quiz-1",
      quizTitle: "Quiz One",
      takenAt: "2026-01-02T10:00:00.000Z",
      questionResults: [
        { questionId: "q1", prompt: "Question 1 updated", correct: false },
        { questionId: "q2", prompt: "Question 2", correct: false },
      ],
    },
  ];

  it("aggregates mistakes per question across attempts", () => {
    const entries = aggregateQuestionResults(attempts);
    const q1 = entries.find((entry) => entry.questionId === "q1");
    const q2 = entries.find((entry) => entry.questionId === "q2");

    expect(q1?.mistakeCount).toBe(2);
    expect(q1?.flaggedCount).toBe(1);
    expect(q1?.totalAttempts).toBe(2);
    expect(q1?.correctnessPercentage).toBe(0);
    expect(q1?.prompt).toBe("Question 1 updated");
    expect(q1?.lastMistakenAt).toBe("2026-01-02T10:00:00.000Z");

    expect(q2?.mistakeCount).toBe(1);
    expect(q2?.flaggedCount).toBe(0);
    expect(q2?.totalAttempts).toBe(2);
    expect(q2?.correctnessPercentage).toBe(50);
  });

  it("keeps the latest incorrect answer options for mistake review", () => {
    const entries = aggregateQuestionResults([
      {
        quizId: "quiz-1",
        quizTitle: "Quiz One",
        takenAt: "2026-01-01T10:00:00.000Z",
        questionResults: [
          {
            questionId: "q1",
            prompt: "Question 1",
            correct: false,
            answer: { type: "single_choice", selectedIndex: 0 },
            options: ["C", "A", "B"],
          },
        ],
      },
      {
        quizId: "quiz-1",
        quizTitle: "Quiz One",
        takenAt: "2026-01-02T10:00:00.000Z",
        questionResults: [
          {
            questionId: "q1",
            prompt: "Question 1",
            correct: false,
            answer: { type: "single_choice", selectedIndex: 1 },
            options: ["B", "C", "A"],
          },
        ],
      },
    ]);

    const q1 = entries.find((entry) => entry.questionId === "q1");
    expect(q1?.lastIncorrectAnswer).toEqual({ type: "single_choice", selectedIndex: 1 });
    expect(q1?.lastIncorrectOptions).toEqual(["B", "C", "A"]);
  });

  it("filters and sorts by configured thresholds", () => {
    const entries = buildMistakeEntries(attempts, {
      minMistakes: 2,
      minFlags: 1,
      maxCorrectnessPercentage: 100,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]?.questionId).toBe("q1");
  });

  it("requires both thresholds to qualify", () => {
    expect(
      meetsThreshold(
        {
          quizId: "quiz-1",
          quizTitle: "Quiz One",
          questionId: "q2",
          prompt: "Question 2",
          mistakeCount: 1,
          flaggedCount: 0,
          totalAttempts: 2,
          correctCount: 1,
          correctnessPercentage: 50,
          lastMistakenAt: "2026-01-02T10:00:00.000Z",
          lastFlaggedAt: null,
        },
        { minMistakes: 1, minFlags: 1, maxCorrectnessPercentage: 40 },
      ),
    ).toBe(false);
  });

  it("includes flagged questions even when mistake thresholds are not met", () => {
    expect(
      meetsThreshold(
        {
          quizId: "quiz-1",
          quizTitle: "Quiz One",
          questionId: "q3",
          prompt: "Question 3",
          mistakeCount: 0,
          flaggedCount: 1,
          totalAttempts: 1,
          correctCount: 1,
          correctnessPercentage: 100,
          lastMistakenAt: null,
          lastFlaggedAt: "2026-01-03T10:00:00.000Z",
        },
        { minMistakes: 3, minFlags: 1, maxCorrectnessPercentage: 0 },
      ),
    ).toBe(true);
  });

  it("respects configured minimum flags threshold", () => {
    expect(
      meetsThreshold(
        {
          quizId: "quiz-1",
          quizTitle: "Quiz One",
          questionId: "q4",
          prompt: "Question 4",
          mistakeCount: 0,
          flaggedCount: 1,
          totalAttempts: 1,
          correctCount: 1,
          correctnessPercentage: 100,
          lastMistakenAt: null,
          lastFlaggedAt: "2026-01-04T10:00:00.000Z",
        },
        { minMistakes: 3, minFlags: 2, maxCorrectnessPercentage: 0 },
      ),
    ).toBe(false);
  });

  it("sorts most frequent mistakes first", () => {
    const entries = sortMistakeEntries([
      {
        quizId: "quiz-1",
        quizTitle: "Quiz One",
        questionId: "q2",
        prompt: "Question 2",
        mistakeCount: 1,
        flaggedCount: 0,
        totalAttempts: 2,
        correctCount: 1,
        correctnessPercentage: 50,
        lastMistakenAt: "2026-01-02T10:00:00.000Z",
        lastFlaggedAt: null,
      },
      {
        quizId: "quiz-1",
        quizTitle: "Quiz One",
        questionId: "q1",
        prompt: "Question 1",
        mistakeCount: 2,
        flaggedCount: 1,
        totalAttempts: 2,
        correctCount: 0,
        correctnessPercentage: 0,
        lastMistakenAt: "2026-01-02T10:00:00.000Z",
        lastFlaggedAt: "2026-01-01T10:00:00.000Z",
      },
    ]);

    expect(entries[0]?.questionId).toBe("q1");
  });

  it("detects empty states", () => {
    expect(detectEmptyReason(false, false, 0)).toBe("no_attempts");
    expect(detectEmptyReason(true, false, 0)).toBe("no_mistakes");
    expect(detectEmptyReason(true, true, 0)).toBe("thresholds_exclude_all");
    expect(detectEmptyReason(true, true, 2)).toBe(null);
  });
});
