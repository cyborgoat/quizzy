import { describe, expect, it } from "vitest";
import { completedQuizReview } from "@/lib/completedQuizReview";
import type { QuizQuestion } from "@/types/quiz";

const questions: QuizQuestion[] = [
  { id: "second", type: "single_choice", prompt: "Shuffled choices", options: ["B", "A"], answerIndex: 0, explanation: "B is correct." },
  { id: "first", type: "true_false", prompt: "True?", answer: true },
  { id: "third", type: "multiple_choice", prompt: "Pick both", options: ["X", "Y"], answerIndices: [0, 1] },
];

describe("completed quiz review without a goal", () => {
  it("shows scores, unanswered and flagged questions without a saved attempt", () => {
    const review = completedQuizReview(questions, [
      { questionId: "second", answer: { type: "single_choice", selectedIndex: 0 }, isCorrect: true, flagged: true },
      { questionId: "first", answer: { type: "true_false", selectedAnswer: false }, isCorrect: false, flagged: false },
    ]);
    expect(review.summary).toMatchObject({ score: 1, total: 3, percentage: 33, incorrectCount: 2, unansweredCount: 1 });
    expect(review.summary.indexItems.map((item) => item.flagged)).toEqual([true, false, false]);
    expect(review.items[2].record).toEqual({ questionId: "third", isCorrect: false, flagged: false });
  });

  it("keeps shuffled question and option order for review and later saving to a goal", () => {
    const review = completedQuizReview(questions, [
      { questionId: "second", answer: { type: "single_choice", selectedIndex: 0 }, isCorrect: true, flagged: true },
    ]);
    expect(review.items.map((item) => item.question.id)).toEqual(["second", "first", "third"]);
    expect(review.items[0].question).toBe(questions[0]);
    expect(review.attempt.questionResults[0]).toEqual({
      questionId: "second", prompt: "Shuffled choices", correct: true,
      answer: { type: "single_choice", selectedIndex: 0 }, options: ["B", "A"], flagged: true,
    });
    expect(review.attempt.score).toBe(review.summary.score);
    expect(review.attempt.total).toBe(review.summary.total);
  });
});
