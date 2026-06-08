import { invoke } from "@tauri-apps/api/core";
import type { Goal, GoalAttempt } from "@/types/goal";

export type WorkingDirectoryState = {
  path: string | null;
  available: boolean;
};

export type NativeQuizFile = {
  fileName: string;
  contents: string;
  readError?: string;
};

export type WriteImportedQuizRequest = {
  fileName: string;
  contents: string;
  overwrite: boolean;
  removeFileName?: string;
};

export type GoalMeta = Omit<Goal, "attempts">;

export const nativeApi = {
  getWorkingDirectory: () =>
    invoke<WorkingDirectoryState>("get_working_directory"),
  setWorkingDirectory: (path: string) =>
    invoke<void>("set_working_directory", { path }),
  readWorkingDirectory: () =>
    invoke<NativeQuizFile[]>("read_working_directory"),
  readImportFiles: (paths: string[]) =>
    invoke<NativeQuizFile[]>("read_import_files", { paths }),
  writeImportedQuiz: (request: WriteImportedQuizRequest) =>
    invoke<void>("write_imported_quiz", { request }),
  deleteQuizFile: (fileName: string) =>
    invoke<void>("delete_quiz_file", { fileName }),
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
};

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
