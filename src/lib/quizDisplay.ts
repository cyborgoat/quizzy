import type { QuizQuestion } from "@/types/quiz";

export function getQuestionOptions(question: QuizQuestion) {
  return question.type === "true_false" ? ["True", "False"] : question.options;
}

export function questionTypeHint(type: QuizQuestion["type"]) {
  switch (type) {
    case "multiple_choice":
      return "Select all answers that apply";
    case "true_false":
      return "True or false";
    default:
      return "Select one answer";
  }
}
