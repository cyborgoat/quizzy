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
        { questionId: "q1", prompt: "Question 1", correct: false },
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
    expect(q1?.totalAttempts).toBe(2);
    expect(q1?.correctnessPercentage).toBe(0);
    expect(q1?.prompt).toBe("Question 1 updated");
    expect(q1?.lastMistakenAt).toBe("2026-01-02T10:00:00.000Z");

    expect(q2?.mistakeCount).toBe(1);
    expect(q2?.totalAttempts).toBe(2);
    expect(q2?.correctnessPercentage).toBe(50);
  });

  it("filters and sorts by configured thresholds", () => {
    const entries = buildMistakeEntries(attempts, {
      minMistakes: 2,
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
          totalAttempts: 2,
          correctCount: 1,
          correctnessPercentage: 50,
          lastMistakenAt: "2026-01-02T10:00:00.000Z",
        },
        { minMistakes: 1, maxCorrectnessPercentage: 40 },
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
        totalAttempts: 2,
        correctCount: 1,
        correctnessPercentage: 50,
        lastMistakenAt: "2026-01-02T10:00:00.000Z",
      },
      {
        quizId: "quiz-1",
        quizTitle: "Quiz One",
        questionId: "q1",
        prompt: "Question 1",
        mistakeCount: 2,
        totalAttempts: 2,
        correctCount: 0,
        correctnessPercentage: 0,
        lastMistakenAt: "2026-01-02T10:00:00.000Z",
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
