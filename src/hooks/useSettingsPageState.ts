import { confirm, open } from "@tauri-apps/plugin-dialog";
import { useBlocker } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSynchronize } from "@/hooks/useAppSynchronize";
import { useAppShortcuts } from "@/hooks/useAppShortcuts";
import { useMistakeLogSettings } from "@/hooks/useMistakeLogSettings";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizPreferences } from "@/hooks/useQuizPreferences";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import { serializeKeybind, SHORTCUT_FIELDS, type ShortcutDraftKey } from "@/lib/keybinds";
import { errorMessage, nativeApi, type SyncReport } from "@/lib/native";
import {
  draftFromPersisted,
  hasSettingsChanges,
  toSaveSettingsRequest,
  type PersistedSettingsSnapshot,
  type SettingsDraft,
  type SettingsDraftErrors,
  type SettingsFieldKey,
  validateSettingsDraft,
} from "@/lib/settingsDraft";
import { formatSyncSections, formatSyncSummary } from "@/lib/syncReport";

export function useSettingsPageState() {
  const { userName, setUserName } = useUserProfile();
  const {
    shuffleQuestions,
    shuffleOptions,
    setShuffleQuestions,
    setShuffleOptions,
  } = useQuizPreferences();
  const {
    knowledgeLink,
    knowledgeNewNote,
    zoomIn,
    zoomOut,
    toggleSidebar,
    setKnowledgeLink,
    setKnowledgeNewNote,
    setZoomIn,
    setZoomOut,
    setToggleSidebar,
  } = useAppShortcuts();
  const {
    minMistakes,
    minFlags,
    maxCorrectnessPercentage,
    setMinMistakes,
    setMinFlags,
    setMaxCorrectnessPercentage,
  } = useMistakeLogSettings();
  const library = useQuizLibrary();
  const { refresh: refreshWorkingDirectory } = useWorkingDirectory();
  const { synchronizeAll, isSyncing } = useAppSynchronize();
  const [lastSyncReport, setLastSyncReport] = useState<SyncReport | null>(null);
  const [errors, setErrors] = useState<SettingsDraftErrors>({});

  const persisted = useMemo(() => {
    const shortcutBinds = {
      knowledgeLink,
      knowledgeNewNote,
      zoomIn,
      zoomOut,
      toggleSidebar,
    };

    return draftFromPersisted({
      userName,
      shuffleQuestions,
      shuffleOptions,
      minMistakes,
      minFlags,
      maxCorrectnessPercentage,
      ...(Object.fromEntries(
        SHORTCUT_FIELDS.map((field) => [
          field.draftKey,
          serializeKeybind(shortcutBinds[field.contextBindKey]),
        ]),
      ) as Pick<PersistedSettingsSnapshot, ShortcutDraftKey>),
    });
  }, [
      userName,
      shuffleQuestions,
      shuffleOptions,
      minMistakes,
      minFlags,
      maxCorrectnessPercentage,
      knowledgeLink,
      knowledgeNewNote,
      zoomIn,
      zoomOut,
      toggleSidebar,
  ]);

  const [draft, setDraft] = useState<SettingsDraft>(persisted);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- reset draft when persisted settings change */
    setDraft(persisted);
    setErrors({});
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [persisted]);

  const displayDir = draft.pendingDir ?? library.directoryPath;
  const hasChanges = hasSettingsChanges(draft, persisted);

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => hasChanges,
    withResolver: true,
    enableBeforeUnload: hasChanges,
  });

  useEffect(() => {
    if (status !== "blocked") return;
    confirm("You have unsaved changes. Leave without saving?", {
      title: "Unsaved changes",
      kind: "warning",
    }).then((ok) => {
      if (ok) proceed();
      else reset();
    });
  }, [status, proceed, reset]);

  const syncSections = useMemo(
    () => (lastSyncReport ? formatSyncSections(lastSyncReport) : null),
    [lastSyncReport],
  );

  function updateDraft(patch: Partial<SettingsDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function clearFieldError(field: SettingsFieldKey) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSynchronize() {
    const approved = await confirm(
      "Synchronize all app data? Quizzy will rescan your quiz and knowledge folders, rebuild goal attempt indexes and the Mistake Log index, and refresh goals and mistakes in memory. Your quiz and knowledge files will not be modified.",
      { title: "Synchronize data", kind: "warning" },
    );
    if (!approved) return;

    try {
      const report = await synchronizeAll();
      setLastSyncReport(report);
      toast.success(formatSyncSummary(report));
      if (report.warnings.length > 0) {
        toast.warning(
          `${report.warnings.length} warning${report.warnings.length === 1 ? "" : "s"} — see the synchronization summary below.`,
        );
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handlePickDirectory() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: displayDir ?? undefined,
        title: "Choose Quizzy working directory",
      });
      if (!selected || Array.isArray(selected)) return;
      updateDraft({ pendingDir: selected });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleSave() {
    const validation = validateSettingsDraft(draft);
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const { parsed } = validation;

    try {
      await nativeApi.saveSettings(toSaveSettingsRequest(parsed));
    } catch (error) {
      toast.error(errorMessage(error));
      return;
    }

    setUserName(parsed.name);
    setShuffleQuestions(parsed.shuffleQuestions);
    setShuffleOptions(parsed.shuffleOptions);
    setMinMistakes(parsed.minMistakes);
    setMinFlags(parsed.minFlags);
    setMaxCorrectnessPercentage(parsed.maxCorrectness);
    setKnowledgeLink(parsed.knowledgeLinkShortcut);
    setKnowledgeNewNote(parsed.knowledgeNewNoteShortcut);
    setZoomIn(parsed.zoomInShortcut);
    setZoomOut(parsed.zoomOutShortcut);
    setToggleSidebar(parsed.toggleSidebarShortcut);

    if (parsed.pendingDir !== null) {
      await refreshWorkingDirectory();
      await library.refresh();
    }

    toast.success("Settings saved.");
  }

  return {
    draft,
    errors,
    hasChanges,
    displayDir,
    directoryPath: library.directoryPath,
    directoryAvailable: library.directoryAvailable,
    isSyncing,
    lastSyncReport,
    syncSections,
    updateDraft,
    clearFieldError,
    handleSave,
    handlePickDirectory,
    handleSynchronize,
  };
}
