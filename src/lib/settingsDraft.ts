import {
  findDuplicateKeybind,
  parseKeybind,
  serializeKeybind,
  SHORTCUT_FIELDS,
  validateKeybindSerialized,
  type Keybind,
  type ShortcutDraftKey,
} from "@/lib/keybinds";
import type { SaveSettingsRequest } from "@/lib/native";

export type SettingsDraft = {
  name: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
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
  | "minMistakes"
  | "minFlags"
  | "maxCorrectness"
  | ShortcutDraftKey;

export type SettingsDraftErrors = Partial<Record<SettingsFieldKey, string>>;

export type NumericSettingsFieldKey =
  | "minMistakes"
  | "minFlags"
  | "maxCorrectness";

export type ParsedSettingsDraft = {
  name: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
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
  minMistakes: number;
  minFlags: number;
  maxCorrectnessPercentage: number;
} & Record<ShortcutDraftKey, string>;

function normalizeShortcutDraftValue(value: string, fallback: Keybind) {
  return serializeKeybind(parseKeybind(value, fallback));
}

export function draftFromPersisted({
  userName,
  shuffleQuestions,
  shuffleOptions,
  minMistakes,
  minFlags,
  maxCorrectnessPercentage,
  ...shortcutValues
}: PersistedSettingsSnapshot): SettingsDraft {
  const shortcuts = Object.fromEntries(
    SHORTCUT_FIELDS.map((field) => [
      field.draftKey,
      normalizeShortcutDraftValue(
        shortcutValues[field.draftKey],
        field.defaultBind,
      ),
    ]),
  ) as Pick<SettingsDraft, ShortcutDraftKey>;

  return {
    name: userName,
    shuffleQuestions,
    shuffleOptions,
    minMistakes: String(minMistakes),
    minFlags: String(minFlags),
    maxCorrectness: String(maxCorrectnessPercentage),
    ...shortcuts,
    pendingDir: null,
  };
}

export function hasSettingsChanges(draft: SettingsDraft, persisted: SettingsDraft) {
  if (
    draft.name.trim() !== persisted.name ||
    draft.pendingDir !== null ||
    draft.shuffleQuestions !== persisted.shuffleQuestions ||
    draft.shuffleOptions !== persisted.shuffleOptions ||
    draft.minMistakes !== persisted.minMistakes ||
    draft.minFlags !== persisted.minFlags ||
    draft.maxCorrectness !== persisted.maxCorrectness
  ) {
    return true;
  }

  return SHORTCUT_FIELDS.some((field) => draft[field.draftKey] !== persisted[field.draftKey]);
}

export function validateSettingsDraft(
  draft: SettingsDraft,
):
  | { ok: true; parsed: ParsedSettingsDraft }
  | { ok: false; errors: SettingsDraftErrors } {
  const errors: SettingsDraftErrors = {};

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

  const shortcutFields = Object.fromEntries(
    SHORTCUT_FIELDS.map((field) => [field.draftKey, draft[field.draftKey]]),
  ) as Record<ShortcutDraftKey, string>;

  for (const field of SHORTCUT_FIELDS) {
    const error = validateKeybindSerialized(draft[field.draftKey]);
    if (error) errors[field.draftKey] = error;
  }

  const duplicate = findDuplicateKeybind(shortcutFields);
  if (duplicate) {
    errors[duplicate.field as SettingsFieldKey] = duplicate.message;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const normalizedShortcuts = Object.fromEntries(
    SHORTCUT_FIELDS.map((field) => [
      field.draftKey,
      normalizeShortcutDraftValue(draft[field.draftKey], field.defaultBind),
    ]),
  ) as Pick<ParsedSettingsDraft, ShortcutDraftKey>;

  return {
    ok: true,
    parsed: {
      name: draft.name.trim(),
      shuffleQuestions: draft.shuffleQuestions,
      shuffleOptions: draft.shuffleOptions,
      minMistakes: parsedMinMistakes,
      minFlags: parsedMinFlags,
      maxCorrectness: parsedMaxCorrectness,
      ...normalizedShortcuts,
      pendingDir: draft.pendingDir,
    },
  };
}

export function validateNumericSetting(
  field: NumericSettingsFieldKey,
  rawValue: string,
): { ok: true; value: number } | { ok: false; error: string } {
  const value = Number(rawValue);

  if (field === "minMistakes" || field === "minFlags") {
    return Number.isInteger(value) && value >= 1
      ? { ok: true, value }
      : { ok: false, error: "Enter a whole number of at least 1." };
  }

  return Number.isFinite(value) && value >= 0 && value <= 100
    ? { ok: true, value }
    : { ok: false, error: "Enter a number between 0 and 100." };
}

export function validateShortcutSettings(
  draft: Pick<SettingsDraft, ShortcutDraftKey>,
):
  | { ok: true; values: Record<ShortcutDraftKey, string> }
  | { ok: false; errors: SettingsDraftErrors } {
  const errors: SettingsDraftErrors = {};
  const shortcutValues = Object.fromEntries(
    SHORTCUT_FIELDS.map((field) => [field.draftKey, draft[field.draftKey]]),
  ) as Record<ShortcutDraftKey, string>;

  for (const field of SHORTCUT_FIELDS) {
    const error = validateKeybindSerialized(draft[field.draftKey]);
    if (error) errors[field.draftKey] = error;
  }

  const duplicate = findDuplicateKeybind(shortcutValues);
  if (duplicate) {
    errors[duplicate.field as SettingsFieldKey] = duplicate.message;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    values: Object.fromEntries(
      SHORTCUT_FIELDS.map((field) => [
        field.draftKey,
        normalizeShortcutDraftValue(draft[field.draftKey], field.defaultBind),
      ]),
    ) as Record<ShortcutDraftKey, string>,
  };
}

export function toSaveSettingsRequest(parsed: ParsedSettingsDraft): SaveSettingsRequest {
  const request: SaveSettingsRequest = {
    profileName: parsed.name,
    shuffleQuestions: parsed.shuffleQuestions,
    shuffleOptions: parsed.shuffleOptions,
    mistakeLogMinMistakes: parsed.minMistakes,
    mistakeLogMinFlags: parsed.minFlags,
    mistakeLogMaxCorrectnessPercentage: parsed.maxCorrectness,
  };

  for (const field of SHORTCUT_FIELDS) {
    request[field.apiKey] = parsed[field.draftKey];
  }

  if (parsed.pendingDir !== null) {
    request.workingDirectory = parsed.pendingDir;
  }

  return request;
}
