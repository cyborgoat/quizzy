import { describe, expect, it } from "vitest";
import {
  initialQuizSessionState,
  quizSessionReducer,
} from "@/lib/quizSessionState";
import { orderQuestionsByType } from "@/lib/questionOrder";
import type { Quiz } from "@/types/quiz";

const quiz: Quiz = {
  id: "navigation-test",
  title: "Navigation Test",
  tags: [],
  questions: [
    {
      id: "q1",
      type: "single_choice",
      prompt: "Choose B",
      options: ["A", "B"],
      answerIndex: 1,
    },
    {
      id: "q2",
      type: "true_false",
      prompt: "True?",
      answer: true,
    },
    {
      id: "q3",
      type: "multiple_choice",
      prompt: "Choose A and C",
      options: ["A", "B", "C"],
      answerIndices: [0, 2],
    },
  ],
};

const orderedQuestions = orderQuestionsByType(quiz.questions);

describe("quizSessionReducer", () => {
  it("preserves answer drafts and flags while navigating", () => {
    let state = quizSessionReducer(initialQuizSessionState, {
      type: "set_answer",
      questionId: "q1",
      answer: { type: "single_choice", selectedIndex: 1 },
    });
    state = quizSessionReducer(state, {
      type: "toggle_flag",
      questionId: "q1",
    });
    state = quizSessionReducer(state, {
      type: "go_to_question",
      index: 2,
      totalQuestions: quiz.questions.length,
    });

    expect(state.currentQuestionIndex).toBe(2);
    expect(state.attempts.q1).toEqual({
      questionId: "q1",
      answer: { type: "single_choice", selectedIndex: 1 },
      flagged: true,
    });
  });

  it("clamps direct navigation to quiz boundaries", () => {
    const beforeFirst = quizSessionReducer(initialQuizSessionState, {
      type: "go_to_question",
      index: -2,
      totalQuestions: quiz.questions.length,
    });
    const afterLast = quizSessionReducer(initialQuizSessionState, {
      type: "go_to_question",
      index: 99,
      totalQuestions: quiz.questions.length,
    });
    expect(beforeFirst.currentQuestionIndex).toBe(0);
    expect(afterLast.currentQuestionIndex).toBe(2);
  });

  it("scores unanswered questions as incorrect and freezes submitted results", () => {
    let state = quizSessionReducer(initialQuizSessionState, {
      type: "set_answer",
      questionId: "q1",
      answer: { type: "single_choice", selectedIndex: 1 },
    });
    state = quizSessionReducer(state, {
      type: "toggle_flag",
      questionId: "q2",
    });
    state = quizSessionReducer(state, {
      type: "submit_quiz",
      questions: orderedQuestions,
    });

    expect(state.isComplete).toBe(true);
    expect(state.answers).toEqual([
      {
        questionId: "q1",
        answer: { type: "single_choice", selectedIndex: 1 },
        isCorrect: true,
        flagged: false,
      },
      {
        questionId: "q3",
        answer: undefined,
        isCorrect: false,
        flagged: false,
      },
      {
        questionId: "q2",
        answer: undefined,
        isCorrect: false,
        flagged: true,
      },
    ]);

    const frozen = quizSessionReducer(state, {
      type: "set_answer",
      questionId: "q2",
      answer: { type: "true_false", selectedAnswer: true },
    });
    expect(frozen).toBe(state);
  });

  it("restart clears navigation, answers, flags, and results", () => {
    const completed = quizSessionReducer(
      quizSessionReducer(initialQuizSessionState, {
        type: "toggle_flag",
        questionId: "q1",
      }),
      { type: "submit_quiz", questions: orderedQuestions },
    );
    expect(quizSessionReducer(completed, { type: "restart" })).toEqual(
      initialQuizSessionState,
    );
  });
});
