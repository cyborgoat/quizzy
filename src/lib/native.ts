import { invoke } from "@tauri-apps/api/core";
import type { Goal, GoalAttempt } from "@/types/goal";

export type AppSettings = {
  workingDirectory: string | null;
  workingDirectoryAvailable: boolean;
  profileName: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  mistakeLogMinMistakes: number;
  mistakeLogMinFlags: number;
  mistakeLogMaxCorrectnessPercentage: number;
  uiFontSize: number;
  uiDensity: string;
};

export type SaveSettingsRequest = {
  workingDirectory?: string;
  profileName?: string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  mistakeLogMinMistakes?: number;
  mistakeLogMinFlags?: number;
  mistakeLogMaxCorrectnessPercentage?: number;
  uiFontSize?: number;
  uiDensity?: string;
};

export type NativeQuizFile = {
  fileName: string;
  contents: string;
  readError?: string;
};

export type NativeKnowledgeFile = NativeQuizFile;

export type WriteKnowledgeFileRequest = {
  fileName: string;
  contents: string;
  overwrite: boolean;
};

export type GoalMeta = Omit<Goal, "attempts">;

export const nativeApi = {
  getSettings: () => invoke<AppSettings>("get_settings"),
  saveSettings: (request: SaveSettingsRequest) =>
    invoke<void>("save_settings", { request }),
  readWorkingDirectory: () =>
    invoke<NativeQuizFile[]>("read_working_directory"),
  readKnowledgeDirectory: () =>
    invoke<NativeKnowledgeFile[]>("read_knowledge_directory"),
  writeKnowledgeFile: (request: WriteKnowledgeFileRequest) =>
    invoke<void>("write_knowledge_file", { request }),
  deleteKnowledgeFile: (fileName: string) =>
    invoke<void>("delete_knowledge_file", { fileName }),
  openQuizFolder: () => invoke<void>("open_quiz_folder"),
  openKnowledgeFolder: () => invoke<void>("open_knowledge_folder"),
  listGoals: () =>
    invoke<Goal[]>("list_goals"),
  upsertGoal: (goal: GoalMeta) =>
    invoke<void>("upsert_goal", { goal }),
  deleteGoal: (goalId: string) =>
    invoke<void>("delete_goal", { goalId }),
  saveGoalAttempt: (goalId: string, attempt: GoalAttempt) =>
    invoke<void>("save_goal_attempt", { goalId, attempt }),
  getGoalAttempt: (goalId: string, attemptId: string) =>
    invoke<GoalAttempt>("get_goal_attempt", { goalId, attemptId }),
  deleteGoalAttempt: (goalId: string, attemptId: string) =>
    invoke<void>("delete_goal_attempt", { goalId, attemptId }),
};

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
