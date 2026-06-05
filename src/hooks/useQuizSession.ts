import { useState } from "react";
import { isAnswerCorrect } from "@/lib/scoring";
import type { AnswerRecord, Quiz, SubmittedAnswer } from "@/types/quiz";

export function useQuizSession(quiz: Quiz) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedSingleChoiceIndex, setSelectedSingleChoiceIndex] = useState<
    number | null
  >(null);
  const [selectedMultipleChoiceIndices, setSelectedMultipleChoiceIndices] =
    useState<number[]>([]);
  const [selectedTrueFalseAnswer, setSelectedTrueFalseAnswer] = useState<
    boolean | null
  >(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentAnswerIsCorrect =
    answers.find((answer) => answer.questionId === currentQuestion?.id)?.isCorrect ??
    null;
  const score = answers.filter((answer) => answer.isCorrect).length;

  function clearSelection() {
    setSelectedSingleChoiceIndex(null);
    setSelectedMultipleChoiceIndices([]);
    setSelectedTrueFalseAnswer(null);
    setHasSubmittedAnswer(false);
    setSubmissionError(null);
  }

  function selectSingleChoiceAnswer(index: number) {
    if (hasSubmittedAnswer) return;
    setSelectedSingleChoiceIndex(index);
    setSubmissionError(null);
  }

  function toggleMultipleChoiceAnswer(index: number) {
    if (hasSubmittedAnswer) return;
    setSelectedMultipleChoiceIndices((selected) =>
      selected.includes(index)
        ? selected.filter((value) => value !== index)
        : [...selected, index].sort((left, right) => left - right),
    );
    setSubmissionError(null);
  }

  function selectTrueFalseAnswer(answer: boolean) {
    if (hasSubmittedAnswer) return;
    setSelectedTrueFalseAnswer(answer);
    setSubmissionError(null);
  }

  function submitAnswer() {
    if (hasSubmittedAnswer) return;

    let answer: SubmittedAnswer | null = null;
    if (currentQuestion.type === "single_choice" && selectedSingleChoiceIndex !== null) {
      answer = { type: "single_choice", selectedIndex: selectedSingleChoiceIndex };
    }
    if (
      currentQuestion.type === "multiple_choice" &&
      selectedMultipleChoiceIndices.length > 0
    ) {
      answer = {
        type: "multiple_choice",
        selectedIndices: selectedMultipleChoiceIndices,
      };
    }
    if (currentQuestion.type === "true_false" && selectedTrueFalseAnswer !== null) {
      answer = { type: "true_false", selectedAnswer: selectedTrueFalseAnswer };
    }

    if (!answer) {
      setSubmissionError("Select an answer before submitting.");
      return;
    }

    const record: AnswerRecord = {
      questionId: currentQuestion.id,
      answer,
      isCorrect: isAnswerCorrect(currentQuestion, answer),
    };
    setAnswers((existing) => [...existing, record]);
    setHasSubmittedAnswer(true);
    setSubmissionError(null);
  }

  function goToNextQuestion() {
    if (!hasSubmittedAnswer) return;
    if (currentQuestionIndex === quiz.questions.length - 1) {
      setIsComplete(true);
      return;
    }
    setCurrentQuestionIndex((index) => index + 1);
    clearSelection();
  }

  function restart() {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setIsComplete(false);
    clearSelection();
  }

  return {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions: quiz.questions.length,
    selectedSingleChoiceIndex,
    selectedMultipleChoiceIndices,
    selectedTrueFalseAnswer,
    hasSubmittedAnswer,
    currentAnswerIsCorrect,
    submissionError,
    score,
    answers,
    isComplete,
    selectSingleChoiceAnswer,
    toggleMultipleChoiceAnswer,
    selectTrueFalseAnswer,
    submitAnswer,
    goToNextQuestion,
    restart,
  };
}
