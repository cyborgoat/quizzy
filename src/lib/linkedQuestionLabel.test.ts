import { describe, expect, it } from "vitest";
import { formatQuizQuestionLabel, getQuestionNumber } from "@/lib/linkedQuestionLabel";
import type { QuizSource } from "@/types/quiz";

const quizzes: QuizSource[] = [
  {
    fileName: "react-basics.json",
    quiz: {
      id: "react-basics",
      title: "React Basics",
      tags: [],
      questions: [
        {
          id: "q1",
          type: "single_choice",
          prompt: "What is JSX?",
          options: ["A", "B"],
          answerIndex: 0,
        },
        {
          id: "q2",
          type: "true_false",
          prompt: "React is a library.",
          answer: true,
        },
      ],
    },
  },
];

describe("linkedQuestionLabel", () => {
  it("returns one-based question numbers from the quiz file order", () => {
    expect(getQuestionNumber(quizzes[0]!.quiz.questions, "q2")).toBe(2);
    expect(getQuestionNumber(quizzes[0]!.quiz.questions, "missing")).toBeNull();
  });

  it("formats linked questions as quiz title and question number", () => {
    expect(
      formatQuizQuestionLabel(
        { quizId: "react-basics", questionId: "q2" },
        quizzes,
      ),
    ).toBe("React Basics · Q2");
  });

  it("formats mistake log rows with quiz title and question number", () => {
    expect(
      formatQuizQuestionLabel(
        { quizId: "react-basics", questionId: "q1" },
        quizzes,
        { quizTitleFallback: "React Basics" },
      ),
    ).toBe("React Basics · Q1");
  });

  it("shows only the question number when the mistake log is quiz scoped", () => {
    expect(
      formatQuizQuestionLabel(
        { quizId: "react-basics", questionId: "q2" },
        quizzes,
        { quizScoped: true },
      ),
    ).toBe("Q2");
  });
});
