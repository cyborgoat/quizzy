import { describe, expect, it } from "vitest";
import { matchesReviewFilter, remapAnswerToFileQuestion, defaultReviewFilter, initialReviewQuestionIndex } from "@/lib/quizReview";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

const fileQuestion: QuizQuestion = {
  id: "q1",
  type: "single_choice",
  prompt: "Pick one",
  options: ["A", "B", "C"],
  answerIndex: 1,
};

describe("remapAnswerToFileQuestion", () => {
  it("remaps shuffled single-choice answers back to file option order", () => {
    const remapped = remapAnswerToFileQuestion(
      fileQuestion,
      { type: "single_choice", selectedIndex: 0 },
      ["C", "A", "B"],
    );

    expect(remapped).toEqual({ type: "single_choice", selectedIndex: 2 });
  });

  it("returns the original answer when session options are unavailable", () => {
    const answer = { type: "single_choice" as const, selectedIndex: 1 };
    expect(remapAnswerToFileQuestion(fileQuestion, answer)).toBe(answer);
  });
});

describe("matchesReviewFilter", () => {
  const correct: AnswerRecord = {
    questionId: "q1",
    answer: { type: "single_choice", selectedIndex: 0 },
    isCorrect: true,
    flagged: false,
  };
  const incorrect: AnswerRecord = {
    questionId: "q2",
    answer: { type: "single_choice", selectedIndex: 1 },
    isCorrect: false,
    flagged: false,
  };
  const flagged: AnswerRecord = {
    questionId: "q3",
    answer: { type: "single_choice", selectedIndex: 0 },
    isCorrect: true,
    flagged: true,
  };

  it("filters correct answers", () => {
    expect(matchesReviewFilter(correct, "correct")).toBe(true);
    expect(matchesReviewFilter(incorrect, "correct")).toBe(false);
  });

  it("filters incorrect answers", () => {
    expect(matchesReviewFilter(incorrect, "incorrect")).toBe(true);
    expect(matchesReviewFilter(correct, "incorrect")).toBe(false);
  });

  it("filters flagged answers", () => {
    expect(matchesReviewFilter(flagged, "flagged")).toBe(true);
    expect(matchesReviewFilter(correct, "flagged")).toBe(false);
  });

  it("includes all answers for the all filter", () => {
    expect(matchesReviewFilter(correct, "all")).toBe(true);
    expect(matchesReviewFilter(incorrect, "all")).toBe(true);
    expect(matchesReviewFilter(flagged, "all")).toBe(true);
  });
});

describe("defaultReviewFilter", () => {
  it("defaults to incorrect when mistakes exist", () => {
    expect(
      defaultReviewFilter([
        { record: { questionId: "q1", answer: undefined, isCorrect: false, flagged: false } },
      ]),
    ).toBe("incorrect");
  });

  it("defaults to all for a perfect attempt", () => {
    expect(
      defaultReviewFilter([
        { record: { questionId: "q1", answer: undefined, isCorrect: true, flagged: false } },
      ]),
    ).toBe("all");
  });
});

describe("initialReviewQuestionIndex", () => {
  const items = [
    { index: 0, record: { questionId: "q1", answer: undefined, isCorrect: true, flagged: false } },
    { index: 1, record: { questionId: "q2", answer: undefined, isCorrect: false, flagged: false } },
  ];

  it("selects the first filtered question", () => {
    expect(initialReviewQuestionIndex(items, "incorrect")).toBe(1);
  });
});
