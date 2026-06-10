import { useMemo, useReducer, useState } from "react";
import { useQuizPreferences } from "@/hooks/useQuizPreferences";
import { buildQuizSessionQuestions } from "@/lib/questionOrder";
import {
  initialQuizSessionState,
  quizSessionReducer,
} from "@/lib/quizSessionState";
import type { QuizSessionConfig } from "@/types/quizSession";
import type { Quiz, SubmittedAnswer } from "@/types/quiz";

function sessionQuestionOptions(
  config: QuizSessionConfig,
  shuffleQuestions: boolean,
  shuffleOptions: boolean,
) {
  return {
    mode: config.mode,
    questionCount: config.questionCount,
    shuffleQuestions,
    shuffleOptions,
  };
}

export function useQuizSession(quiz: Quiz, config: QuizSessionConfig) {
  const { shuffleQuestions, shuffleOptions } = useQuizPreferences();
  const [questions, setQuestions] = useState(() =>
    buildQuizSessionQuestions(
      quiz.questions,
      sessionQuestionOptions(config, shuffleQuestions, shuffleOptions),
    ),
  );
  const [state, dispatch] = useReducer(
    quizSessionReducer,
    initialQuizSessionState,
  );

  const currentQuestion = questions[state.currentQuestionIndex];
  const currentAttempt = state.attempts[currentQuestion.id];
  const currentAnswer = currentAttempt?.answer;
  const answeredCount = useMemo(
    () => questions.filter((question) => state.attempts[question.id]?.answer).length,
    [questions, state.attempts],
  );
  const flaggedCount = useMemo(
    () => questions.filter((question) => state.attempts[question.id]?.flagged).length,
    [questions, state.attempts],
  );
  const score = useMemo(
    () => state.answers.filter((answer) => answer.isCorrect).length,
    [state.answers],
  );

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
      setQuestions(
        buildQuizSessionQuestions(
          quiz.questions,
          sessionQuestionOptions(config, shuffleQuestions, shuffleOptions),
        ),
      );
      dispatch({ type: "restart" });
    },
  };
}
