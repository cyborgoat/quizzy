import { describe, expect, it } from "vitest";
import { isAnswerCorrect, setsEqual } from "@/lib/scoring";
import type { MultipleChoiceQuestion } from "@/types/quiz";

describe("scoring", () => {
  it("compares multiple-choice answers as sets", () => {
    expect(setsEqual([2, 0], [0, 2])).toBe(true);
    expect(setsEqual([0], [0, 2])).toBe(false);
    expect(setsEqual([0, 1], [0, 2])).toBe(false);
  });

  it("does not award partial multiple-choice credit", () => {
    const question: MultipleChoiceQuestion = {
      id: "q1",
      type: "multiple_choice",
      prompt: "Choose both",
      options: ["A", "B", "C"],
      answerIndices: [0, 2],
    };
    expect(
      isAnswerCorrect(question, {
        type: "multiple_choice",
        selectedIndices: [0],
      }),
    ).toBe(false);
    expect(
      isAnswerCorrect(question, {
        type: "multiple_choice",
        selectedIndices: [2, 0],
      }),
    ).toBe(true);
  });
});
