import {
  findDuplicateKeybind,
  parseKeybind,
  serializeKeybind,
  SHORTCUT_FIELDS,
  validateKeybindSerialized,
  type Keybind,
  type ShortcutDraftKey,
} from "@/lib/keybinds";
import type { MessageKey } from "@/lib/i18n-messages";

export type SettingsDraft = {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  quizhubEnabled: boolean;
  quizhubBaseUrl: string;
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

export type SettingsDraftErrors = Partial<Record<SettingsFieldKey, MessageKey>>;

export type NumericSettingsFieldKey =
  | "minMistakes"
  | "minFlags"
  | "maxCorrectness";

export type PersistedSettingsSnapshot = {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  quizhubEnabled: boolean;
  quizhubBaseUrl: string;
  minMistakes: number;
  minFlags: number;
  maxCorrectnessPercentage: number;
} & Record<ShortcutDraftKey, string>;

function normalizeShortcutDraftValue(value: string, fallback: Keybind) {
  return serializeKeybind(parseKeybind(value, fallback));
}

export function draftFromPersisted({
  shuffleQuestions,
  shuffleOptions,
  quizhubEnabled,
  quizhubBaseUrl,
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
    shuffleQuestions,
    shuffleOptions,
    quizhubEnabled,
    quizhubBaseUrl,
    minMistakes: String(minMistakes),
    minFlags: String(minFlags),
    maxCorrectness: String(maxCorrectnessPercentage),
    ...shortcuts,
    pendingDir: null,
  };
}

export function validateNumericSetting(
  field: NumericSettingsFieldKey,
  rawValue: string,
): { ok: true; value: number } | { ok: false; error: MessageKey } {
  const value = Number(rawValue);

  if (field === "minMistakes" || field === "minFlags") {
    return Number.isInteger(value) && value >= 1
      ? { ok: true, value }
      : { ok: false, error: "settings.validation.minOne" };
  }

  return Number.isFinite(value) && value >= 0 && value <= 100
    ? { ok: true, value }
    : { ok: false, error: "settings.validation.percent" };
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
