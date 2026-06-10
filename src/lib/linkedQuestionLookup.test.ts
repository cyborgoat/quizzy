import { describe, expect, it } from "vitest";
import { resolveLinkedQuestion } from "@/lib/linkedQuestionLookup";
import type { QuizSource } from "@/types/quiz";

const quizzes: QuizSource[] = [
  {
    fileName: "react-basics.json",
    quiz: {
      id: "react-basics",
      title: "React basics",
      description: "A short intro quiz.",
      tags: [],
      questions: [
        {
          id: "hooks-1",
          type: "single_choice",
          prompt: "What does useEffect do?",
          options: ["Runs side effects", "Stores state"],
          answerIndex: 0,
          explanation: "useEffect runs after render.",
        },
      ],
    },
  },
];

describe("resolveLinkedQuestion", () => {
  it("returns quiz and question metadata for a valid link", () => {
    expect(
      resolveLinkedQuestion({ quizId: "react-basics", questionId: "hooks-1" }, quizzes),
    ).toEqual({
      quiz: quizzes[0]!.quiz,
      question: quizzes[0]!.quiz.questions[0],
      questionNumber: 1,
    });
  });

  it("returns null when the quiz or question is missing", () => {
    expect(
      resolveLinkedQuestion({ quizId: "missing", questionId: "hooks-1" }, quizzes),
    ).toBeNull();
    expect(
      resolveLinkedQuestion({ quizId: "react-basics", questionId: "missing" }, quizzes),
    ).toBeNull();
  });
});
