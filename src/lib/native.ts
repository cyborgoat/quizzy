import { invoke } from "@tauri-apps/api/core";
import type { Goal, GoalAttempt } from "@/types/goal";
import type { MistakeEntry } from "@/types/mistakeLog";

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

export type MistakeIndex = {
  version: number;
  scoredAttemptCount: number;
  entries: MistakeEntry[];
};

export type SyncChangeKind =
  | "legacy_goals_migrated"
  | "attempt_index_rebuilt"
  | "goal_title_updated"
  | "mistake_index_rebuilt";

export type SyncChange = {
  kind: SyncChangeKind | string;
  path?: string;
  detail: string;
};

export type SyncWarningKind = "goal_quiz_missing" | "working_directory_unavailable";

export type SyncWarning = {
  kind: SyncWarningKind | string;
  detail: string;
};

export type SyncReport = {
  quizzesScanned: number;
  knowledgeNotesScanned: number;
  goalsChecked: number;
  appConfigFilesWritten: number;
  attemptIndexesRebuilt: number;
  attemptIndexEntriesAdded: number;
  attemptIndexEntriesRemoved: number;
  goalTitlesUpdated: number;
  mistakeIndexRebuilt: boolean;
  mistakeIndexEntries: number;
  legacyGoalsMigrated: boolean;
  changes: SyncChange[];
  changesTruncated: boolean;
  warnings: SyncWarning[];
};

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
  getMistakeIndex: () => invoke<MistakeIndex>("get_mistake_index"),
  synchronizeAppData: () => invoke<SyncReport>("synchronize_app_data"),
};

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
