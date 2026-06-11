import { describe, expect, it } from "vitest";
import { buildMistakeAnswerRecord, mistakeEntryKey } from "@/lib/mistakeLogReview";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { QuizQuestion } from "@/types/quiz";

const baseEntry: MistakeEntry = {
  quizId: "quiz-1",
  quizTitle: "Quiz One",
  questionId: "q1",
  prompt: "Question 1",
  mistakeCount: 2,
  flaggedCount: 1,
  totalAttempts: 3,
  correctCount: 1,
  correctnessPercentage: 33,
  lastMistakenAt: "2026-01-02T10:00:00.000Z",
  lastFlaggedAt: "2026-01-01T10:00:00.000Z",
  lastIncorrectAnswer: { type: "single_choice", selectedIndex: 1 },
  lastIncorrectOptions: ["A", "B", "C"],
};

const question: QuizQuestion = {
  id: "q1",
  type: "single_choice",
  prompt: "Question 1",
  options: ["A", "B", "C"],
  answerIndex: 0,
};

describe("mistakeLogReview", () => {
  it("builds a stable entry key", () => {
    expect(mistakeEntryKey(baseEntry)).toBe("quiz-1:q1");
  });

  it("remaps the latest incorrect answer to the current quiz file", () => {
    const shuffledEntry: MistakeEntry = {
      ...baseEntry,
      lastIncorrectAnswer: { type: "single_choice", selectedIndex: 0 },
      lastIncorrectOptions: ["C", "A", "B"],
    };
    const record = buildMistakeAnswerRecord(shuffledEntry, question);

    expect(record.questionId).toBe("q1");
    expect(record.answer).toEqual({ type: "single_choice", selectedIndex: 2 });
    expect(record.isCorrect).toBe(false);
    expect(record.flagged).toBe(true);
  });

  it("falls back to stored answer when the question is unavailable", () => {
    const record = buildMistakeAnswerRecord(baseEntry, null);

    expect(record.answer).toEqual({ type: "single_choice", selectedIndex: 1 });
  });
});
