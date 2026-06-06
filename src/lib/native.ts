import { invoke } from "@tauri-apps/api/core";
import type { Goal } from "@/types/goal";

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
  getGoals: () =>
    invoke<Goal[]>("get_goals"),
  saveGoals: (goals: Goal[]) =>
    invoke<void>("save_goals", { goals }),
};

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
