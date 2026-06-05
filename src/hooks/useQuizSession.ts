import { useReducer } from "react";
import {
  initialQuizSessionState,
  quizSessionReducer,
} from "@/lib/quizSessionState";
import type { Quiz, SubmittedAnswer } from "@/types/quiz";

export function useQuizSession(quiz: Quiz) {
  const [state, dispatch] = useReducer(
    quizSessionReducer,
    initialQuizSessionState,
  );

  const currentQuestion = quiz.questions[state.currentQuestionIndex];
  const currentAttempt = state.attempts[currentQuestion.id];
  const currentAnswer = currentAttempt?.answer;
  const answeredCount = quiz.questions.filter(
    (question) => state.attempts[question.id]?.answer,
  ).length;
  const flaggedCount = quiz.questions.filter(
    (question) => state.attempts[question.id]?.flagged,
  ).length;
  const score = state.answers.filter((answer) => answer.isCorrect).length;

  function setCurrentAnswer(answer?: SubmittedAnswer) {
    dispatch({
      type: "set_answer",
      questionId: currentQuestion.id,
      answer,
    });
  }

  function selectSingleChoiceAnswer(index: number) {
    setCurrentAnswer({ type: "single_choice", selectedIndex: index });
  }

  function toggleMultipleChoiceAnswer(index: number) {
    const selected =
      currentAnswer?.type === "multiple_choice"
        ? currentAnswer.selectedIndices
        : [];
    const next = selected.includes(index)
      ? selected.filter((value) => value !== index)
      : [...selected, index].sort((left, right) => left - right);
    setCurrentAnswer(
      next.length > 0
        ? { type: "multiple_choice", selectedIndices: next }
        : undefined,
    );
  }

  function selectTrueFalseAnswer(answer: boolean) {
    setCurrentAnswer({ type: "true_false", selectedAnswer: answer });
  }

  function goToQuestion(index: number) {
    dispatch({
      type: "go_to_question",
      index,
      totalQuestions: quiz.questions.length,
    });
  }

  return {
    currentQuestion,
    currentQuestionIndex: state.currentQuestionIndex,
    totalQuestions: quiz.questions.length,
    currentAnswer,
    attempts: state.attempts,
    answers: state.answers,
    answeredCount,
    unansweredCount: quiz.questions.length - answeredCount,
    flaggedCount,
    currentQuestionIsFlagged: currentAttempt?.flagged ?? false,
    score,
    isComplete: state.isComplete,
    selectSingleChoiceAnswer,
    toggleMultipleChoiceAnswer,
    selectTrueFalseAnswer,
    toggleCurrentQuestionFlag: () =>
      dispatch({ type: "toggle_flag", questionId: currentQuestion.id }),
    goToQuestion,
    goToPreviousQuestion: () => goToQuestion(state.currentQuestionIndex - 1),
    goToNextQuestion: () => goToQuestion(state.currentQuestionIndex + 1),
    submitQuiz: () => dispatch({ type: "submit_quiz", quiz }),
    restart: () => dispatch({ type: "restart" }),
  };
}
