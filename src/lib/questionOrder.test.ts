import { describe, expect, it } from "vitest";
import {
  groupQuestionsByType,
  orderQuestionsByType,
} from "@/lib/questionOrder";
import type { QuizQuestion } from "@/types/quiz";

const questions: QuizQuestion[] = [
  {
    id: "tf-1",
    type: "true_false",
    prompt: "True or false first in JSON",
    answer: true,
  },
  {
    id: "sc-1",
    type: "single_choice",
    prompt: "Single choice A",
    options: ["A", "B"],
    answerIndex: 0,
  },
  {
    id: "mc-1",
    type: "multiple_choice",
    prompt: "Multiple choice A",
    options: ["A", "B"],
    answerIndices: [0],
  },
  {
    id: "sc-2",
    type: "single_choice",
    prompt: "Single choice B",
    options: ["A", "B"],
    answerIndex: 1,
  },
];

describe("orderQuestionsByType", () => {
  it("groups question types in a stable order while preserving JSON order within each type", () => {
    expect(orderQuestionsByType(questions).map((question) => question.id)).toEqual([
      "sc-1",
      "sc-2",
      "mc-1",
      "tf-1",
    ]);
  });
});

describe("groupQuestionsByType", () => {
  it("returns contiguous groups for each question type", () => {
    expect(groupQuestionsByType(questions)).toEqual([
      {
        type: "single_choice",
        questions: [questions[1], questions[3]],
      },
      {
        type: "multiple_choice",
        questions: [questions[2]],
      },
      {
        type: "true_false",
        questions: [questions[0]],
      },
    ]);
  });
});
