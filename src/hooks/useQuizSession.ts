import { useMemo, useReducer, useState } from "react";
import { useQuizPreferences } from "@/hooks/useQuizPreferences";
import { orderQuizQuestions } from "@/lib/questionOrder";
import {
  initialQuizSessionState,
  quizSessionReducer,
} from "@/lib/quizSessionState";
import type { QuizSessionConfig } from "@/types/quizSession";
import type { Quiz, SubmittedAnswer } from "@/types/quiz";

export function useQuizSession(quiz: Quiz, config: QuizSessionConfig) {
  const { shuffleMode } = useQuizPreferences();
  const [orderGeneration, setOrderGeneration] = useState(0);
  const questions = useMemo(() => {
    const ordered = orderQuizQuestions(quiz.questions, shuffleMode);
    if (config.mode === "practice" && config.questionCount != null) {
      return ordered.slice(0, Math.min(config.questionCount, ordered.length));
    }
    return ordered;
    // orderGeneration remounts question order when restarting the quiz.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional shuffle seed
  }, [quiz.questions, shuffleMode, orderGeneration, config.mode, config.questionCount]);
  const [state, dispatch] = useReducer(
    quizSessionReducer,
    initialQuizSessionState,
  );

  const currentQuestion = questions[state.currentQuestionIndex];
  const currentAttempt = state.attempts[currentQuestion.id];
  const currentAnswer = currentAttempt?.answer;
  const answeredCount = questions.filter(
    (question) => state.attempts[question.id]?.answer,
  ).length;
  const flaggedCount = questions.filter(
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
      totalQuestions: questions.length,
    });
  }

  return {
    mode: config.mode,
    questions,
    currentQuestion,
    currentQuestionIndex: state.currentQuestionIndex,
    totalQuestions: questions.length,
    currentAnswer,
    attempts: state.attempts,
    answers: state.answers,
    answeredCount,
    unansweredCount: questions.length - answeredCount,
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
    submitQuiz: () => dispatch({ type: "submit_quiz", questions }),
    restart: () => {
      setOrderGeneration((value) => value + 1);
      dispatch({ type: "restart" });
    },
  };
}
