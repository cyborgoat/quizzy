import type { AnswerRecord, QuizQuestion } from "@/types/quiz";
import type { AttemptSummary, Goal, GoalAttempt } from "@/types/goal";

export type ReviewScoreSummaryData = {
  score: number;
  total: number;
  percentage: number;
  incorrectCount: number;
  unansweredCount: number;
  indexItems: { id: string; isCorrect: boolean; flagged: boolean }[];
};

export type ReviewGoalContext = {
  goal: Goal;
  attemptTakenAt: string;
  targetScore?: number;
  attemptHistory?: {
    goalId: string;
    attempts: AttemptSummary[];
    currentAttemptId: string;
  };
};

export type ReviewPracticeContext = {
  modeLabel: string;
  onRestart: () => void;
};

export function reviewScoreFromAttempt(attempt: GoalAttempt): ReviewScoreSummaryData {
  const unansweredCount = attempt.questionResults.filter((result) => !result.answer).length;

  return {
    score: attempt.score,
    total: attempt.total,
    percentage: attempt.percentage,
    incorrectCount: attempt.incorrectCount,
    unansweredCount,
    indexItems: attempt.questionResults.map((result, index) => ({
      id: `${result.questionId}-${index}`,
      isCorrect: result.correct,
      flagged: result.flagged ?? false,
    })),
  };
}

export function reviewScoreFromSession(input: {
  score: number;
  total: number;
  questions: QuizQuestion[];
  answers: AnswerRecord[];
}): ReviewScoreSummaryData {
  const { score, total, questions, answers } = input;
  const unansweredCount = answers.filter((answer) => !answer.answer).length;
  const incorrectCount = total - score - unansweredCount;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return {
    score,
    total,
    percentage,
    incorrectCount,
    unansweredCount,
    indexItems: questions.map((question, index) => ({
      id: question.id,
      isCorrect: answers[index]?.isCorrect ?? false,
      flagged: answers[index]?.flagged ?? false,
    })),
  };
}
