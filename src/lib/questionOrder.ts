import type { QuizQuestion } from "@/types/quiz";

const TYPE_ORDER: Record<QuizQuestion["type"], number> = {
  single_choice: 0,
  multiple_choice: 1,
  true_false: 2,
};

export const QUESTION_TYPE_LABELS: Record<QuizQuestion["type"], string> = {
  single_choice: "Single choice",
  multiple_choice: "Multiple choice",
  true_false: "True or false",
};

export function orderQuestionsByType(questions: QuizQuestion[]): QuizQuestion[] {
  return [...questions]
    .map((question, index) => ({ question, index }))
    .sort((left, right) => {
      const typeDiff =
        TYPE_ORDER[left.question.type] - TYPE_ORDER[right.question.type];
      if (typeDiff !== 0) return typeDiff;
      return left.index - right.index;
    })
    .map(({ question }) => question);
}

export type QuestionTypeGroup = {
  type: QuizQuestion["type"];
  questions: QuizQuestion[];
};

export function groupQuestionsByType(
  questions: QuizQuestion[],
): QuestionTypeGroup[] {
  const groups: QuestionTypeGroup[] = [];
  for (const question of orderQuestionsByType(questions)) {
    const last = groups[groups.length - 1];
    if (last?.type === question.type) {
      last.questions.push(question);
      continue;
    }
    groups.push({ type: question.type, questions: [question] });
  }
  return groups;
}
