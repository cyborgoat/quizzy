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
};
