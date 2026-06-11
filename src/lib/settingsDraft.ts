import { validateFontSizeInput, type UiDensity } from "@/lib/uiPreferences";

export type SettingsDraft = {
  name: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  fontSize: string;
  density: UiDensity;
  minMistakes: string;
  minFlags: string;
  maxCorrectness: string;
  pendingDir: string | null;
};

export type SettingsFieldKey =
  | "fontSize"
  | "minMistakes"
  | "minFlags"
  | "maxCorrectness";

export type SettingsDraftErrors = Partial<Record<SettingsFieldKey, string>>;

export type ParsedSettingsDraft = {
  name: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  fontSize: number;
  density: UiDensity;
  minMistakes: number;
  minFlags: number;
  maxCorrectness: number;
  pendingDir: string | null;
};

export type PersistedSettingsSnapshot = {
  userName: string;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  fontSize: number;
  density: UiDensity;
  minMistakes: number;
  minFlags: number;
  maxCorrectnessPercentage: number;
};

export function draftFromPersisted({
  userName,
  shuffleQuestions,
  shuffleOptions,
  fontSize,
  density,
  minMistakes,
  minFlags,
  maxCorrectnessPercentage,
}: PersistedSettingsSnapshot): SettingsDraft {
  return {
    name: userName,
    shuffleQuestions,
    shuffleOptions,
    fontSize: String(fontSize),
    density,
    minMistakes: String(minMistakes),
    minFlags: String(minFlags),
    maxCorrectness: String(maxCorrectnessPercentage),
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
    draft.density !== persisted.density ||
    draft.minMistakes !== persisted.minMistakes ||
    draft.minFlags !== persisted.minFlags ||
    draft.maxCorrectness !== persisted.maxCorrectness
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
      density: draft.density,
      minMistakes: parsedMinMistakes,
      minFlags: parsedMinFlags,
      maxCorrectness: parsedMaxCorrectness,
      pendingDir: draft.pendingDir,
    },
  };
}
