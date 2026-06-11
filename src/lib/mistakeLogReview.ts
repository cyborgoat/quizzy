import { remapAnswerToFileQuestion } from "@/lib/quizReview";
import type { MistakeEntry } from "@/types/mistakeLog";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";

export function buildMistakeAnswerRecord(
  entry: MistakeEntry,
  question: QuizQuestion | null,
): AnswerRecord {
  return {
    questionId: entry.questionId,
    answer:
      question && entry.lastIncorrectAnswer
        ? remapAnswerToFileQuestion(
            question,
            entry.lastIncorrectAnswer,
            entry.lastIncorrectOptions,
          )
        : entry.lastIncorrectAnswer,
    isCorrect: entry.mistakeCount === 0,
    flagged: entry.flaggedCount > 0,
  };
}
