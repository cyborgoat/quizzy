import { useMemo } from "react";
import type { GoalAttempt, QuestionResult } from "@/types/goal";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";
import type { QuestionReviewItem } from "@/components/quiz/QuestionReviewList";

export function buildAttemptReviewItems(
  attempt: GoalAttempt,
  questions: QuizQuestion[],
): QuestionReviewItem[] {
  const questionById = new Map(questions.map((question) => [question.id, question]));

  return attempt.questionResults.flatMap((result, index) => {
    const question = questionById.get(result.questionId);
    if (!question) return [];

    return [{
      question,
      index,
      record: questionResultToAnswerRecord(result),
    }];
  });
}

function questionResultToAnswerRecord(result: QuestionResult): AnswerRecord {
  return {
    questionId: result.questionId,
    answer: result.answer,
    isCorrect: result.correct,
    flagged: result.flagged ?? false,
  };
}

export function useAttemptReviewItems(
  attempt: GoalAttempt | undefined,
  questions: QuizQuestion[] | undefined,
) {
  return useMemo(
    () => (attempt && questions ? buildAttemptReviewItems(attempt, questions) : []),
    [attempt, questions],
  );
}
