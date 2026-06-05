import type { QuizQuestion, SubmittedAnswer } from "@/types/quiz";

export function setsEqual(left: number[], right: number[]) {
  if (left.length !== right.length) return false;
  const expected = new Set(right);
  return left.every((value) => expected.has(value));
}

export function isAnswerCorrect(
  question: QuizQuestion,
  answer: SubmittedAnswer,
): boolean {
  if (question.type !== answer.type) return false;

  switch (question.type) {
    case "single_choice":
      return answer.type === "single_choice" && answer.selectedIndex === question.answerIndex;
    case "multiple_choice":
      return (
        answer.type === "multiple_choice" &&
        setsEqual(answer.selectedIndices, question.answerIndices)
      );
    case "true_false":
      return answer.type === "true_false" && answer.selectedAnswer === question.answer;
  }
}
