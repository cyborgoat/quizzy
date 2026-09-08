import { confirm, open } from "@tauri-apps/plugin-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppSynchronize } from "@/hooks/useAppSynchronize";
import { useAppShortcuts } from "@/hooks/useAppShortcuts";
import { useMistakeLogSettings } from "@/hooks/useMistakeLogSettings";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizPreferences } from "@/hooks/useQuizPreferences";
import { useUserProfile } from "@/hooks/useUserProfile";
import { serializeKeybind, SHORTCUT_FIELDS, type ShortcutDraftKey } from "@/lib/keybinds";
import { errorMessage, nativeApi, type SaveSettingsRequest, type SyncReport } from "@/lib/native";
import {
  draftFromPersisted,
  type NumericSettingsFieldKey,
  type PersistedSettingsSnapshot,
  type SettingsDraft,
  type SettingsDraftErrors,
  type SettingsFieldKey,
  validateNumericSetting,
  validateShortcutSettings,
} from "@/lib/settingsDraft";
import { formatSyncSections, formatSyncSummary } from "@/lib/syncReport";

type SavingField = Exclude<keyof SettingsDraft, "pendingDir"> | "workingDirectory";

const PERSISTED_DRAFT_FIELDS = [
  "name",
  "shuffleQuestions",
  "shuffleOptions",
  "minMistakes",
  "minFlags",
  "maxCorrectness",
  "knowledgeLinkShortcut",
  "knowledgeNewNoteShortcut",
  "zoomInShortcut",
  "zoomOutShortcut",
  "toggleSidebarShortcut",
] as const satisfies readonly Exclude<keyof SettingsDraft, "pendingDir">[];

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
  const { synchronizeAll, isSyncing } = useAppSynchronize();
  const [lastSyncReport, setLastSyncReport] = useState<SyncReport | null>(null);
  const [errors, setErrors] = useState<SettingsDraftErrors>({});
  const [savingFields, setSavingFields] = useState<ReadonlySet<SavingField>>(new Set());
  const savingFieldsRef = useRef(new Set<SavingField>());

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
  const previousPersistedRef = useRef(persisted);

  useEffect(() => {
    const previous = previousPersistedRef.current;
    setDraft((current) => {
      const next = { ...current };
      for (const field of PERSISTED_DRAFT_FIELDS) {
        if (current[field] === previous[field]) {
          Object.assign(next, { [field]: persisted[field] });
        }
      }
      return next;
    });
    previousPersistedRef.current = persisted;
  }, [persisted]);

  const displayDir = draft.pendingDir ?? library.directoryPath;
  const syncSections = useMemo(
    () => (lastSyncReport ? formatSyncSections(lastSyncReport) : null),
    [lastSyncReport],
  );

  function updateDraft(patch: Partial<SettingsDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function setSaving(field: SavingField, saving: boolean) {
    if (saving) savingFieldsRef.current.add(field);
    else savingFieldsRef.current.delete(field);
    setSavingFields(new Set(savingFieldsRef.current));
  }

  function clearFieldError(field: SettingsFieldKey) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function clearShortcutErrors() {
    setErrors((current) => {
      const next = { ...current };
      for (const field of SHORTCUT_FIELDS) delete next[field.draftKey];
      return next;
    });
  }

  async function persistSetting(
    field: SavingField,
    request: SaveSettingsRequest,
    apply: () => void,
    rollback: () => void,
  ) {
    if (savingFieldsRef.current.has(field)) return;
    setSaving(field, true);
    apply();
    try {
      await nativeApi.saveSettings(request);
    } catch (error) {
      rollback();
      toast.error(errorMessage(error));
    } finally {
      setSaving(field, false);
    }
  }

  function handleNameChange(name: string) {
    updateDraft({ name });
  }

  function commitName() {
    if (savingFieldsRef.current.has("name")) return;
    const next = draft.name.trim();
    updateDraft({ name: next });
    if (next === userName) return;
    const previous = userName;
    void persistSetting(
      "name",
      { profileName: next },
      () => setUserName(next),
      () => {
        setUserName(previous);
        updateDraft({ name: previous });
      },
    );
  }

  function handleShuffleQuestionsChange(value: boolean) {
    if (savingFieldsRef.current.has("shuffleQuestions")) return;
    const previous = shuffleQuestions;
    updateDraft({ shuffleQuestions: value });
    void persistSetting(
      "shuffleQuestions",
      { shuffleQuestions: value },
      () => setShuffleQuestions(value),
      () => {
        setShuffleQuestions(previous);
        updateDraft({ shuffleQuestions: previous });
      },
    );
  }

  function handleShuffleOptionsChange(value: boolean) {
    if (savingFieldsRef.current.has("shuffleOptions")) return;
    const previous = shuffleOptions;
    updateDraft({ shuffleOptions: value });
    void persistSetting(
      "shuffleOptions",
      { shuffleOptions: value },
      () => setShuffleOptions(value),
      () => {
        setShuffleOptions(previous);
        updateDraft({ shuffleOptions: previous });
      },
    );
  }

  function handleNumericChange(field: NumericSettingsFieldKey, value: string) {
    updateDraft({ [field]: value });
    clearFieldError(field);
  }

  function commitNumericSetting(field: NumericSettingsFieldKey) {
    if (savingFieldsRef.current.has(field)) return;
    const validation = validateNumericSetting(field, draft[field]);
    if (!validation.ok) {
      setErrors((current) => ({ ...current, [field]: validation.error }));
      return;
    }

    clearFieldError(field);
    const value = validation.value;
    updateDraft({ [field]: String(value) });

    if (field === "minMistakes") {
      if (value === minMistakes) return;
      const previous = minMistakes;
      void persistSetting(
        field,
        { mistakeLogMinMistakes: value },
        () => setMinMistakes(value),
        () => {
          setMinMistakes(previous);
          updateDraft({ minMistakes: String(previous) });
        },
      );
      return;
    }

    if (field === "minFlags") {
      if (value === minFlags) return;
      const previous = minFlags;
      void persistSetting(
        field,
        { mistakeLogMinFlags: value },
        () => setMinFlags(value),
        () => {
          setMinFlags(previous);
          updateDraft({ minFlags: String(previous) });
        },
      );
      return;
    }

    if (value === maxCorrectnessPercentage) return;
    const previous = maxCorrectnessPercentage;
    void persistSetting(
      field,
      { mistakeLogMaxCorrectnessPercentage: value },
      () => setMaxCorrectnessPercentage(value),
      () => {
        setMaxCorrectnessPercentage(previous);
        updateDraft({ maxCorrectness: String(previous) });
      },
    );
  }

  function handleShortcutChange(field: ShortcutDraftKey, value: string) {
    if (savingFieldsRef.current.has(field)) return;
    const candidate = { ...draft, [field]: value };
    updateDraft({ [field]: value });
    const validation = validateShortcutSettings(candidate);
    if (!validation.ok) {
      const nextErrors = { ...validation.errors };
      const duplicateField = SHORTCUT_FIELDS.find(
        (item) => nextErrors[item.draftKey] === "This shortcut is already assigned.",
      )?.draftKey;
      if (duplicateField) {
        delete nextErrors[duplicateField];
        nextErrors[field] = "This shortcut is already assigned.";
      }
      clearShortcutErrors();
      setErrors((current) => ({ ...current, ...nextErrors }));
      return;
    }

    clearShortcutErrors();
    const normalized = validation.values[field];
    const previous = persisted[field];
    updateDraft({ [field]: normalized });
    if (normalized === previous) return;

    const metadata = SHORTCUT_FIELDS.find((item) => item.draftKey === field)!;
    const setters: Record<ShortcutDraftKey, (shortcut: string) => void> = {
      knowledgeLinkShortcut: setKnowledgeLink,
      knowledgeNewNoteShortcut: setKnowledgeNewNote,
      zoomInShortcut: setZoomIn,
      zoomOutShortcut: setZoomOut,
      toggleSidebarShortcut: setToggleSidebar,
    };
    const setter = setters[field];
    const request = { [metadata.apiKey]: normalized } as SaveSettingsRequest;
    void persistSetting(
      field,
      request,
      () => setter(normalized),
      () => {
        setter(previous);
        updateDraft({ [field]: previous });
      },
    );
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
      setSaving("workingDirectory", true);
      try {
        await nativeApi.saveSettings({ workingDirectory: selected });
        const report = await synchronizeAll();
        setLastSyncReport(report);
      } catch (error) {
        toast.error(errorMessage(error));
      } finally {
        updateDraft({ pendingDir: null });
        setSaving("workingDirectory", false);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return {
    draft,
    errors,
    savingFields,
    displayDir,
    directoryPath: library.directoryPath,
    directoryAvailable: library.directoryAvailable,
    isSyncing,
    lastSyncReport,
    syncSections,
    handleNameChange,
    commitName,
    handleShuffleQuestionsChange,
    handleShuffleOptionsChange,
    handleNumericChange,
    commitNumericSetting,
    handleShortcutChange,
    handlePickDirectory,
    handleSynchronize,
  };
}
