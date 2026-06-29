import {
  DEFAULT_KEYBINDS,
  findDuplicateKeybind,
  parseKeybind,
  serializeKeybind,
  validateKeybindSerialized,
  type Keybind,
} from "@/lib/keybinds";
import { validateFontSizeInput } from "@/lib/uiPreferences";

export type SettingsDraft = {
  name: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  fontSize: string;
  minMistakes: string;
  minFlags: string;
  maxCorrectness: string;
  knowledgeLinkShortcut: string;
  knowledgeNewNoteShortcut: string;
  zoomInShortcut: string;
  zoomOutShortcut: string;
  toggleSidebarShortcut: string;
  pendingDir: string | null;
};

export type SettingsFieldKey =
  | "fontSize"
  | "minMistakes"
  | "minFlags"
  | "maxCorrectness"
  | "knowledgeLinkShortcut"
  | "knowledgeNewNoteShortcut"
  | "zoomInShortcut"
  | "zoomOutShortcut"
  | "toggleSidebarShortcut";

export type SettingsDraftErrors = Partial<Record<SettingsFieldKey, string>>;

export type ParsedSettingsDraft = {
  name: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  fontSize: number;
  minMistakes: number;
  minFlags: number;
  maxCorrectness: number;
  knowledgeLinkShortcut: string;
  knowledgeNewNoteShortcut: string;
  zoomInShortcut: string;
  zoomOutShortcut: string;
  toggleSidebarShortcut: string;
  pendingDir: string | null;
};

export type PersistedSettingsSnapshot = {
  userName: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  fontSize: number;
  minMistakes: number;
  minFlags: number;
  maxCorrectnessPercentage: number;
  knowledgeLinkShortcut: string;
  knowledgeNewNoteShortcut: string;
  zoomInShortcut: string;
  zoomOutShortcut: string;
  toggleSidebarShortcut: string;
};

function normalizeShortcutDraftValue(value: string, fallback: Keybind) {
  return serializeKeybind(parseKeybind(value, fallback));
}

export function draftFromPersisted({
  userName,
  shuffleQuestions,
  shuffleOptions,
  fontSize,
  minMistakes,
  minFlags,
  maxCorrectnessPercentage,
  knowledgeLinkShortcut,
  knowledgeNewNoteShortcut,
  zoomInShortcut,
  zoomOutShortcut,
  toggleSidebarShortcut,
}: PersistedSettingsSnapshot): SettingsDraft {
  return {
    name: userName,
    shuffleQuestions,
    shuffleOptions,
    fontSize: String(fontSize),
    minMistakes: String(minMistakes),
    minFlags: String(minFlags),
    maxCorrectness: String(maxCorrectnessPercentage),
    knowledgeLinkShortcut: normalizeShortcutDraftValue(
      knowledgeLinkShortcut,
      DEFAULT_KEYBINDS.knowledgeLink,
    ),
    knowledgeNewNoteShortcut: normalizeShortcutDraftValue(
      knowledgeNewNoteShortcut,
      DEFAULT_KEYBINDS.knowledgeNewNote,
    ),
    zoomInShortcut: normalizeShortcutDraftValue(
      zoomInShortcut,
      DEFAULT_KEYBINDS.zoomIn,
    ),
    zoomOutShortcut: normalizeShortcutDraftValue(
      zoomOutShortcut,
      DEFAULT_KEYBINDS.zoomOut,
    ),
    toggleSidebarShortcut: normalizeShortcutDraftValue(
      toggleSidebarShortcut,
      DEFAULT_KEYBINDS.toggleSidebar,
    ),
    pendingDir: null,
  };
}

export function hasSettingsChanges(draft: SettingsDraft, persisted: SettingsDraft) {
  return (
    draft.name.trim() !== persisted.name ||
    draft.pendingDir !== null ||
    draft.shuffleQuestions !== persisted.shuffleQuestions ||
    draft.shuffleOptions !== persisted.shuffleOptions ||
    draft.fontSize !== persisted.fontSize ||
    draft.minMistakes !== persisted.minMistakes ||
    draft.minFlags !== persisted.minFlags ||
    draft.maxCorrectness !== persisted.maxCorrectness ||
    draft.knowledgeLinkShortcut !== persisted.knowledgeLinkShortcut ||
    draft.knowledgeNewNoteShortcut !== persisted.knowledgeNewNoteShortcut ||
    draft.zoomInShortcut !== persisted.zoomInShortcut ||
    draft.zoomOutShortcut !== persisted.zoomOutShortcut ||
    draft.toggleSidebarShortcut !== persisted.toggleSidebarShortcut
  );
}

export function validateSettingsDraft(
  draft: SettingsDraft,
):
  | { ok: true; parsed: ParsedSettingsDraft }
  | { ok: false; errors: SettingsDraftErrors } {
  const errors: SettingsDraftErrors = {};

  const fontSizeError = validateFontSizeInput(draft.fontSize);
  if (fontSizeError) errors.fontSize = fontSizeError;

  const parsedMinMistakes = Number(draft.minMistakes);
  if (!Number.isInteger(parsedMinMistakes) || parsedMinMistakes < 1) {
    errors.minMistakes = "Enter a whole number of at least 1.";
  }

  const parsedMinFlags = Number(draft.minFlags);
  if (!Number.isInteger(parsedMinFlags) || parsedMinFlags < 1) {
    errors.minFlags = "Enter a whole number of at least 1.";
  }

  const parsedMaxCorrectness = Number(draft.maxCorrectness);
  if (
    !Number.isFinite(parsedMaxCorrectness) ||
    parsedMaxCorrectness < 0 ||
    parsedMaxCorrectness > 100
  ) {
    errors.maxCorrectness = "Enter a number between 0 and 100.";
  }

  const shortcutFields = {
    knowledgeLinkShortcut: draft.knowledgeLinkShortcut,
    knowledgeNewNoteShortcut: draft.knowledgeNewNoteShortcut,
    zoomInShortcut: draft.zoomInShortcut,
    zoomOutShortcut: draft.zoomOutShortcut,
    toggleSidebarShortcut: draft.toggleSidebarShortcut,
  } as const;

  for (const [field, value] of Object.entries(shortcutFields) as Array<
    [SettingsFieldKey, string]
  >) {
    const error = validateKeybindSerialized(value);
    if (error) errors[field] = error;
  }

  const duplicate = findDuplicateKeybind(shortcutFields);
  if (duplicate) {
    errors[duplicate.field as SettingsFieldKey] = duplicate.message;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    parsed: {
      name: draft.name.trim(),
      shuffleQuestions: draft.shuffleQuestions,
      shuffleOptions: draft.shuffleOptions,
      fontSize: Number(draft.fontSize),
      minMistakes: parsedMinMistakes,
      minFlags: parsedMinFlags,
      maxCorrectness: parsedMaxCorrectness,
      knowledgeLinkShortcut: normalizeShortcutDraftValue(
        draft.knowledgeLinkShortcut,
        DEFAULT_KEYBINDS.knowledgeLink,
      ),
      knowledgeNewNoteShortcut: normalizeShortcutDraftValue(
        draft.knowledgeNewNoteShortcut,
        DEFAULT_KEYBINDS.knowledgeNewNote,
      ),
      zoomInShortcut: normalizeShortcutDraftValue(
        draft.zoomInShortcut,
        DEFAULT_KEYBINDS.zoomIn,
      ),
      zoomOutShortcut: normalizeShortcutDraftValue(
        draft.zoomOutShortcut,
        DEFAULT_KEYBINDS.zoomOut,
      ),
      toggleSidebarShortcut: normalizeShortcutDraftValue(
        draft.toggleSidebarShortcut,
        DEFAULT_KEYBINDS.toggleSidebar,
      ),
      pendingDir: draft.pendingDir,
    },
  };
}
