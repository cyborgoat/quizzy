import { describe, expect, it } from "vitest";
import {
  buildQuizSessionQuestions,
  groupQuestionsByType,
  orderQuestionsByType,
  selectPracticeQuestions,
  shuffleQuestionOptions,
  shuffleQuestionsWithinGroups,
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

describe("shuffleQuestionsWithinGroups", () => {
  it("keeps question type groups while shuffling within each group", () => {
    expect(
      shuffleQuestionsWithinGroups(questions, () => 0).map((question) => question.id),
    ).toEqual(["sc-2", "sc-1", "mc-1", "tf-1"]);
  });
});

describe("selectPracticeQuestions", () => {
  it("round-robins across question types instead of taking one type first", () => {
    expect(
      selectPracticeQuestions(questions, 3).map((question) => question.id),
    ).toEqual(["tf-1", "sc-1", "mc-1"]);
  });

  it("returns every question when the count covers the full quiz", () => {
    expect(selectPracticeQuestions(questions, 10)).toEqual(questions);
  });
});

describe("buildQuizSessionQuestions", () => {
  it("keeps a stable order for the same inputs and random seed", () => {
    const random = () => 0;
    const first = buildQuizSessionQuestions(
      questions,
      { mode: "scored", shuffleQuestions: true, shuffleOptions: true },
      random,
    );
    const second = buildQuizSessionQuestions(
      questions,
      { mode: "scored", shuffleQuestions: true, shuffleOptions: true },
      random,
    );
    expect(first.map((question) => question.id)).toEqual(
      second.map((question) => question.id),
    );
  });
});

describe("shuffleQuestionOptions", () => {
  it("remaps single choice answers to match shuffled options", () => {
    const shuffled = shuffleQuestionOptions([questions[1]], () => 0);
    const singleChoice = shuffled[0];
    if (singleChoice.type !== "single_choice") {
      throw new Error("Expected single choice question");
    }

    expect(singleChoice.options).toEqual(["B", "A"]);
    expect(singleChoice.answerIndex).toBe(1);
  });

  it("remaps multiple choice answers to match shuffled options", () => {
    const multiple: QuizQuestion = {
      id: "mc-remap",
      type: "multiple_choice",
      prompt: "Pick A and C",
      options: ["A", "B", "C"],
      answerIndices: [0, 1],
    };

    const shuffled = shuffleQuestionOptions([multiple], () => 0);
    const shuffledMultiple = shuffled[0];
    if (shuffledMultiple.type !== "multiple_choice") {
      throw new Error("Expected multiple choice question");
    }

    expect(shuffledMultiple.options).toEqual(["B", "C", "A"]);
    expect(shuffledMultiple.answerIndices).toEqual([0, 2]);
  });
});
