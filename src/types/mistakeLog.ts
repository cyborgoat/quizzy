import type { SubmittedAnswer } from "@/types/quiz";

export type MistakeEntry = {
  quizId: string;
  quizTitle: string;
  questionId: string;
  prompt: string;
  mistakeCount: number;
  totalAttempts: number;
  correctCount: number;
  correctnessPercentage: number;
  lastMistakenAt: string | null;
  lastIncorrectAnswer?: SubmittedAnswer;
};

export type MistakeLogThresholds = {
  minMistakes: number;
  maxCorrectnessPercentage: number;
};

export type MistakeLogSummary = {
  qualifyingCount: number;
  totalMistakeEvents: number;
  quizCount: number;
};

export type MistakeLogEmptyReason =
  | "no_attempts"
  | "no_mistakes"
  | "thresholds_exclude_all"
  | null;
