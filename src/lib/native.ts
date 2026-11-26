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
  quizhubEnabled: boolean;
  quizhubBaseUrl: string;
  /** Empty until the user chooses a language on first launch. */
  appLocale: string;
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
  quizhubEnabled?: boolean;
  /** Empty string resets to the default quizhub URL. */
  quizhubBaseUrl?: string;
  appLocale?: string;
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
  changes: SyncChange[];
  changesTruncated: boolean;
  warnings: SyncWarning[];
};

export type HubKind = "quiz" | "note";

export type HubItemState =
  | "available"
  | "installed"
  | "updateAvailable"
  | "removedRemotely";

export type HubScope = {
  workingDirectory: string;
  baseUrl: string;
};

export type HubSelection = {
  scope: HubScope;
  locale: string;
  manifestUrl: string;
};

export type HubLocale = { id: string; name: string; feed: string; manifest: string };
export type HubDomain = { id: string; title: string };

export type HubCategory = {
  id: string;
  title: string;
  domain: string;
  feed: string | null;
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
  locales: HubLocale[];
  defaultLocale: string;
  activeLocale: string;
  manifestUrl: string | null;
  editionError: string | null;
  refreshError: string | null;
  domains: HubDomain[];
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

export type HubConflict = HubItemRef & {
  title: string;
  fileName: string;
  suggestedName: string | null;
  existingSha: string;
  remoteSha: string;
  message: string | null;
};

export type HubResolution = {
  item: HubItemRef;
  existingSha: string;
  remoteSha: string;
  renamedFileName?: string;
};

export type HubDownloadReport = {
  added: number;
  updated: number;
  unchanged: number;
  skipped: number;
  failed: number;
  outcomes: HubItemOutcome[];
  conflicts: HubConflict[];
};

export type HubPreview = {
  kind: HubKind;
  id: string;
  title: string;
  contents: string;
};

export type ResetLevel =
  | "quizhubCache"
  | "studyHistory"
  | "libraryMetadata"
  | "factory";

export type ResetReport = {
  level: ResetLevel;
  cleared: string[];
};

const saveSettings = createSettingsSaveQueue((request: SaveSettingsRequest) =>
  invoke<void>("save_settings", { request }),
);

export const nativeApi = {
  getSettings: () => invoke<AppSettings>("get_settings"),
  saveSettings,
  readWorkingDirectory: (workingDirectory: string, knownVersions?: Record<string, string>) =>
    invoke<NativeQuizFile[]>("read_working_directory", { workingDirectory, knownVersions }),
  importQuizFile: (sourcePath: string) =>
    invoke<string>("import_quiz_file", { sourcePath }),
  addSampleQuizzes: () =>
    invoke<{ added: string[]; skipped: string[] }>("add_sample_quizzes"),
  listFavoriteQuizIds: (workingDirectory: string) => invoke<string[]>("list_favorite_quiz_ids", { workingDirectory }),
  setQuizFavorite: (workingDirectory: string, quizId: string, favorite: boolean) =>
    invoke<void>("set_quiz_favorite", { workingDirectory, quizId, favorite }),
  listArchivedQuizIds: (workingDirectory: string) => invoke<string[]>("list_archived_quiz_ids", { workingDirectory }),
  setQuizArchived: (workingDirectory: string, quizId: string, archived: boolean) =>
    invoke<void>("set_quiz_archived", { workingDirectory, quizId, archived }),
  deleteQuizFile: (workingDirectory: string, fileName: string) =>
    invoke<void>("delete_quiz_file", { workingDirectory, fileName }),
  readKnowledgeDirectory: (workingDirectory: string, knownVersions?: Record<string, string>) =>
    invoke<NativeKnowledgeFile[]>("read_knowledge_directory", { workingDirectory, knownVersions }),
  writeKnowledgeFile: (workingDirectory: string, request: WriteKnowledgeFileRequest) =>
    invoke<void>("write_knowledge_file", { workingDirectory, request }),
  deleteKnowledgeFile: (workingDirectory: string, fileName: string) =>
    invoke<void>("delete_knowledge_file", { workingDirectory, fileName }),
  listKnowledgeViewCounts: (workingDirectory: string) =>
    invoke<Record<string, number>>("list_knowledge_view_counts", { workingDirectory }),
  recordKnowledgeView: (workingDirectory: string, noteId: string) =>
    invoke<number>("record_knowledge_view", { workingDirectory, noteId }),
  openQuizFolder: () => invoke<void>("open_quiz_folder"),
  openKnowledgeFolder: () => invoke<void>("open_knowledge_folder"),
  listGoals: (workingDirectory: string) =>
    invoke<Goal[]>("list_goals", { workingDirectory }),
  upsertGoal: (workingDirectory: string, goal: GoalMeta) =>
    invoke<void>("upsert_goal", { workingDirectory, goal }),
  deleteGoal: (workingDirectory: string, goalId: string) =>
    invoke<void>("delete_goal", { workingDirectory, goalId }),
  saveGoalAttempt: (workingDirectory: string, goalId: string, attempt: GoalAttempt) =>
    invoke<void>("save_goal_attempt", { workingDirectory, goalId, attempt }),
  getGoalAttempt: (workingDirectory: string, goalId: string, attemptId: string) =>
    invoke<GoalAttempt>("get_goal_attempt", { workingDirectory, goalId, attemptId }),
  deleteGoalAttempt: (workingDirectory: string, goalId: string, attemptId: string) =>
    invoke<void>("delete_goal_attempt", { workingDirectory, goalId, attemptId }),
  getMistakeIndex: (workingDirectory: string) => invoke<MistakeIndex>("get_mistake_index", { workingDirectory }),
  synchronizeAppData: () => invoke<SyncReport>("synchronize_app_data"),
  resetAppData: (level: ResetLevel) => invoke<ResetReport>("reset_app_data", { level }),
  hubFetchCatalog: (scope: HubScope, locale: string | null, force: boolean) =>
    invoke<HubCatalog>("hub_fetch_catalog", { scope, locale, force }),
  hubListInstalled: (scope: HubScope) => invoke<HubInstalledItem[]>("hub_list_installed", { scope }),
  hubDownload: (selection: HubSelection, items: HubItemRef[], resolution?: HubResolution) =>
    invoke<HubDownloadReport>("hub_download", { selection, items, resolution }),
  hubPreviewItem: (selection: HubSelection, item: HubItemRef) =>
    invoke<HubPreview>("hub_preview_item", { selection, item }),
  hubRemove: (selection: HubSelection, item: HubItemRef, options: { keepFile?: boolean; force?: boolean } = {}) =>
    invoke<void>("hub_remove", { selection, item, keepFile: options.keepFile, force: options.force }),
};

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
