import type { QuizQuestion } from "@/types/quiz";

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
