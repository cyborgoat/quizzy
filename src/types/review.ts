import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

export type QuestionReviewItem = {
  question: QuizQuestion;
  index: number;
  record: AnswerRecord;
};
