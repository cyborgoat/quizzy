import type { MessageKey, TFunction } from "@/lib/i18n-messages";
import type { QuizQuestion } from "@/types/quiz";

export function getQuestionOptions(question: QuizQuestion, t: TFunction) {
  return question.type === "true_false"
    ? [t("question.true"), t("question.false")]
    : question.options;
}

const QUESTION_TYPE_HINT_KEYS = {
  single_choice: "question.hint.single_choice",
  multiple_choice: "question.hint.multiple_choice",
  true_false: "question.hint.true_false",
} as const satisfies Record<QuizQuestion["type"], MessageKey>;

export function questionTypeHint(type: QuizQuestion["type"], t: TFunction) {
  return t(QUESTION_TYPE_HINT_KEYS[type]);
}
