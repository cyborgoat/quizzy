import type { QuizQuestion, SubmittedAnswer } from "@/types/quiz";

export function isOptionCorrect(question: QuizQuestion, index: number) {
  if (question.type === "single_choice") return question.answerIndex === index;
  if (question.type === "multiple_choice") return question.answerIndices.includes(index);
  return (index === 0) === question.answer;
}

export function isOptionSelected(
  question: QuizQuestion,
  answer: SubmittedAnswer | undefined,
  index: number,
) {
  if (!answer) return false;
  if (question.type === "single_choice" && answer.type === "single_choice") {
    return answer.selectedIndex === index;
  }
  if (question.type === "multiple_choice" && answer.type === "multiple_choice") {
    return answer.selectedIndices.includes(index);
  }
  if (question.type === "true_false" && answer.type === "true_false") {
    return answer.selectedAnswer === (index === 0);
  }
  return false;
}

export function isOptionIncorrectSelection(
  question: QuizQuestion,
  answer: SubmittedAnswer | undefined,
  index: number,
) {
  return isOptionSelected(question, answer, index) && !isOptionCorrect(question, index);
}
