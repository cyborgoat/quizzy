export type QuestionResult = {
  questionId: string;
  prompt: string;
  correct: boolean;
};

export type GoalAttempt = {
  id: string;
  takenAt: string;
  score: number;
  total: number;
  percentage: number;
  questionResults: QuestionResult[];
};

export type Goal = {
  id: string;
  quizId: string;
  quizTitle: string;
  description: string;
  targetScore?: number;
  deadline?: string;
  createdAt: string;
  completed: boolean;
  completedAt?: string;
  attempts: GoalAttempt[];
};
