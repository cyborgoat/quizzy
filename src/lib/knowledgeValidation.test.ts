import { describe, expect, it } from "vitest";
import { getLinkWarnings } from "@/lib/knowledgeValidation";
import type { QuizSource } from "@/types/quiz";

const quizzes: QuizSource[] = [
  {
    fileName: "quiz.json",
    quiz: {
      id: "quiz-a",
      title: "Quiz A",
      tags: [],
      questions: [
        {
          id: "q1",
          type: "true_false",
          prompt: "True?",
          answer: true,
        },
      ],
    },
  },
];

describe("getLinkWarnings", () => {
  it("warns for unknown quiz and question links", () => {
    const warnings = getLinkWarnings(
      {
        linkedQuizQuestions: [
          { quizId: "missing-quiz", questionId: "q1" },
          { quizId: "quiz-a", questionId: "missing-question" },
        ],
      },
      quizzes,
    );

    expect(warnings).toEqual([
      { quizId: "missing-quiz", questionId: "q1", reason: "unknown_quiz" },
      { quizId: "quiz-a", questionId: "missing-question", reason: "unknown_question" },
    ]);
  });
});
