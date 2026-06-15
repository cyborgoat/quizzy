import { describe, expect, it } from "vitest";
import {
  allReviewFilters,
  defaultReviewFilters,
  initialReviewQuestionIndex,
  isShowingAllReviewFilters,
  matchesReviewFilter,
  remapAnswerToFileQuestion,
  toggleReviewFilter,
} from "@/lib/quizReview";
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
    expect(matchesReviewFilter(correct, new Set(["correct"]))).toBe(true);
    expect(matchesReviewFilter(incorrect, new Set(["correct"]))).toBe(false);
  });

  it("filters incorrect answers", () => {
    expect(matchesReviewFilter(incorrect, new Set(["incorrect"]))).toBe(true);
    expect(matchesReviewFilter(correct, new Set(["incorrect"]))).toBe(false);
  });

  it("filters flagged answers", () => {
    expect(matchesReviewFilter(flagged, new Set(["flagged"]))).toBe(true);
    expect(matchesReviewFilter(correct, new Set(["flagged"]))).toBe(false);
  });

  it("includes all answers when every filter is active", () => {
    const filters = allReviewFilters();
    expect(matchesReviewFilter(correct, filters)).toBe(true);
    expect(matchesReviewFilter(incorrect, filters)).toBe(true);
    expect(matchesReviewFilter(flagged, filters)).toBe(true);
  });

  it("excludes answers when no filters are active", () => {
    expect(matchesReviewFilter(correct, new Set())).toBe(false);
  });

  it("matches when any active filter applies", () => {
    const filters = new Set(["incorrect", "flagged"] as const);
    expect(matchesReviewFilter(incorrect, filters)).toBe(true);
    expect(matchesReviewFilter(flagged, filters)).toBe(true);
    expect(matchesReviewFilter(correct, filters)).toBe(false);
  });
});

describe("defaultReviewFilters", () => {
  it("defaults to incorrect when mistakes exist", () => {
    expect(
      defaultReviewFilters([
        { record: { questionId: "q1", answer: undefined, isCorrect: false, flagged: false } },
      ]),
    ).toEqual(new Set(["incorrect"]));
  });

  it("defaults to all filters for a perfect attempt", () => {
    expect(
      defaultReviewFilters([
        { record: { questionId: "q1", answer: undefined, isCorrect: true, flagged: false } },
      ]),
    ).toEqual(allReviewFilters());
  });
});

describe("isShowingAllReviewFilters", () => {
  it("is true only when every filter kind is active", () => {
    expect(isShowingAllReviewFilters(allReviewFilters())).toBe(true);
    expect(isShowingAllReviewFilters(new Set(["incorrect", "correct", "flagged"]))).toBe(true);
    expect(isShowingAllReviewFilters(new Set(["incorrect", "flagged"]))).toBe(false);
    expect(isShowingAllReviewFilters(new Set())).toBe(false);
  });
});

describe("toggleReviewFilter", () => {
  it("activates every filter when all is toggled on", () => {
    expect(toggleReviewFilter(new Set(["incorrect"]), "all")).toEqual(allReviewFilters());
  });

  it("clears every filter when all is toggled off", () => {
    expect(toggleReviewFilter(allReviewFilters(), "all")).toEqual(new Set());
  });

  it("allows deselecting the last active filter", () => {
    expect(toggleReviewFilter(new Set(["incorrect"]), "incorrect")).toEqual(new Set());
  });
});

describe("initialReviewQuestionIndex", () => {
  const items = [
    { index: 0, record: { questionId: "q1", answer: undefined, isCorrect: true, flagged: false } },
    { index: 1, record: { questionId: "q2", answer: undefined, isCorrect: false, flagged: false } },
  ];

  it("selects the first filtered question", () => {
    expect(initialReviewQuestionIndex(items, new Set(["incorrect"]))).toBe(1);
  });
});
