import { describe, expect, it } from "vitest";
import { quizSchema } from "@/data/quizSchema";

const baseQuiz = {
  id: "test",
  title: "Test",
  questions: [
    {
      id: "q1",
      type: "single_choice",
      prompt: "Question?",
      options: ["A", "B"],
      answerIndex: 1,
    },
  ],
};

describe("quizSchema", () => {
  it("defaults tags to an empty array", () => {
    expect(quizSchema.parse(baseQuiz).tags).toEqual([]);
  });

  it("rejects out-of-range and duplicate answer indices", () => {
    const result = quizSchema.safeParse({
      ...baseQuiz,
      questions: [
        {
          id: "q1",
          type: "multiple_choice",
          prompt: "Question?",
          options: ["A", "B"],
          answerIndices: [1, 1, 3],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining([
          "Answer indices must be unique.",
          "Every answer index must reference an available option.",
        ]),
      );
    }
  });

  it("rejects duplicate question IDs", () => {
    const result = quizSchema.safeParse({
      ...baseQuiz,
      questions: [baseQuiz.questions[0], baseQuiz.questions[0]],
    });
    expect(result.success).toBe(false);
  });
});
