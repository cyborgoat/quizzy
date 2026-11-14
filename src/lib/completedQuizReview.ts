import type { AttemptInput } from "@/contexts/goals-context";
import type { ReviewScoreSummaryData } from "@/lib/quizReviewSummary";
import type { AnswerRecord, QuizQuestion } from "@/types/quiz";
import type { QuestionReviewItem } from "@/types/review";

/** Uses session order so shuffled questions and options match the submitted answers. */
export function completedQuizReview(questions: QuizQuestion[], answers: AnswerRecord[]) {
  const items: QuestionReviewItem[] = questions.map((question, index) => ({
    question,
    index,
    record: answers[index] ?? { questionId: question.id, isCorrect: false, flagged: false },
  }));
  const score = items.filter((item) => item.record.isCorrect).length;
  const attempt: AttemptInput = {
    score,
    total: questions.length,
    questionResults: items.map(({ question, record }) => ({
      questionId: question.id,
      prompt: question.prompt,
      correct: record.isCorrect,
      answer: record.answer,
      options: question.type === "true_false" ? undefined : question.options,
      flagged: record.flagged,
    })),
  };
  const summary: ReviewScoreSummaryData = {
    score,
    total: questions.length,
    percentage: questions.length ? Math.round(score / questions.length * 100) : 0,
    incorrectCount: questions.length - score,
    unansweredCount: items.filter((item) => !item.record.answer).length,
    indexItems: items.map(({ question, record }, index) => ({
      id: `${question.id}-${index}`, isCorrect: record.isCorrect, flagged: record.flagged,
    })),
  };
  return { items, attempt, summary };
}
