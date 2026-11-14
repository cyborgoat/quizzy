import { invoke } from "@tauri-apps/api/core";
import type { NativeLibraryFile } from "@/lib/fileVersionCache";
import { createSettingsSaveQueue } from "@/lib/settingsSaveQueue";
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
  knowledgeLinkShortcutKey: string;
  knowledgeNewNoteShortcutKey: string;
  zoomInShortcutKey: string;
  zoomOutShortcutKey: string;
  toggleSidebarShortcutKey: string;
  quizhubBaseUrl: string;
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
  knowledgeLinkShortcutKey?: string;
  knowledgeNewNoteShortcutKey?: string;
  zoomInShortcutKey?: string;
  zoomOutShortcutKey?: string;
  toggleSidebarShortcutKey?: string;
  /** Empty string resets to the default quizhub URL. */
  quizhubBaseUrl?: string;
};

export type NativeQuizFile = NativeLibraryFile;

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

export type HubKind = "quiz" | "note";

export type HubItemState =
  | "available"
  | "nameTaken"
  | "installed"
  | "updateAvailable"
  | "modifiedLocally"
  | "removedRemotely";

export type HubCategory = {
  id: string;
  title: string;
  quizCount: number;
  noteCount: number;
};

export type HubItem = {
  kind: HubKind;
  id: string;
  category: string;
  title: string;
  tags: string[];
  size: number;
  updated?: string;
  fileName: string;
  state: HubItemState;
};

export type HubCatalog = {
  checkedAt: number;
  baseUrl: string;
  generatedAt?: string;
  categories: HubCategory[];
  items: HubItem[];
  skipped: string[];
};

export type HubItemRef = { kind: HubKind; id: string };

export type HubInstalledItem = HubItemRef & { fileName: string; category: string };

export type HubItemOutcome = HubItemRef & {
  title: string;
  result: "added" | "updated" | "unchanged" | "skipped" | "failed";
  detail?: string;
};

export type HubDownloadReport = {
  added: number;
  updated: number;
  unchanged: number;
  skipped: number;
  failed: number;
  outcomes: HubItemOutcome[];
};

const saveSettings = createSettingsSaveQueue((request: SaveSettingsRequest) =>
  invoke<void>("save_settings", { request }),
);

export const nativeApi = {
  getSettings: () => invoke<AppSettings>("get_settings"),
  saveSettings,
  readWorkingDirectory: (knownVersions?: Record<string, string>) =>
    invoke<NativeQuizFile[]>("read_working_directory", { knownVersions }),
  importQuizFile: (sourcePath: string) =>
    invoke<string>("import_quiz_file", { sourcePath }),
  addSampleQuizzes: () =>
    invoke<{ added: string[]; skipped: string[] }>("add_sample_quizzes"),
  listFavoriteQuizIds: () => invoke<string[]>("list_favorite_quiz_ids"),
  setQuizFavorite: (quizId: string, favorite: boolean) =>
    invoke<void>("set_quiz_favorite", { quizId, favorite }),
  listArchivedQuizIds: () => invoke<string[]>("list_archived_quiz_ids"),
  setQuizArchived: (quizId: string, archived: boolean) =>
    invoke<void>("set_quiz_archived", { quizId, archived }),
  deleteQuizFile: (fileName: string) =>
    invoke<void>("delete_quiz_file", { fileName }),
  readKnowledgeDirectory: (knownVersions?: Record<string, string>) =>
    invoke<NativeKnowledgeFile[]>("read_knowledge_directory", { knownVersions }),
  writeKnowledgeFile: (request: WriteKnowledgeFileRequest) =>
    invoke<void>("write_knowledge_file", { request }),
  deleteKnowledgeFile: (fileName: string) =>
    invoke<void>("delete_knowledge_file", { fileName }),
  listKnowledgeViewCounts: () =>
    invoke<Record<string, number>>("list_knowledge_view_counts"),
  recordKnowledgeView: (noteId: string) =>
    invoke<number>("record_knowledge_view", { noteId }),
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
  hubFetchCatalog: (force = false) =>
    invoke<HubCatalog>("hub_fetch_catalog", { force }),
  hubListInstalled: () => invoke<HubInstalledItem[]>("hub_list_installed"),
  hubDownload: (items: HubItemRef[], force = false) =>
    invoke<HubDownloadReport>("hub_download", { items, force }),
  hubRemove: (item: HubItemRef, options: { keepFile?: boolean; force?: boolean } = {}) =>
    invoke<void>("hub_remove", { item, keepFile: options.keepFile, force: options.force }),
};

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
