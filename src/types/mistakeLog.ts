import type { SubmittedAnswer } from "@/types/quiz";

export type MistakeEntry = {
  quizId: string;
  quizTitle: string;
  questionId: string;
  prompt: string;
  mistakeCount: number;
  flaggedCount: number;
  totalAttempts: number;
  correctCount: number;
  correctnessPercentage: number;
  lastMistakenAt: string | null;
  lastFlaggedAt: string | null;
  lastIncorrectAnswer?: SubmittedAnswer;
};

export type MistakeLogThresholds = {
  minMistakes: number;
  minFlags: number;
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
