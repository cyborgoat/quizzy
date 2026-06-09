import { describe, expect, it } from "vitest";
import { remapAnswerToFileQuestion } from "@/lib/quizReview";
import type { QuizQuestion } from "@/types/quiz";

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
