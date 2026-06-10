import { nativeApi, type AppSettings } from "@/lib/native";

const LEGACY_NAME_KEY = "quizzy:profile:name";
const LEGACY_SHUFFLE_KEY = "quizzy:preferences:shuffle-mode";

let inflightSettings: Promise<AppSettings> | null = null;

async function loadAppSettingsImpl(): Promise<AppSettings> {
  const settings = await nativeApi.getSettings();
  const updates: {
    profileName?: string;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
  } = {};

  const legacyName = localStorage.getItem(LEGACY_NAME_KEY);
  if (legacyName && !settings.profileName) {
    updates.profileName = legacyName;
    localStorage.removeItem(LEGACY_NAME_KEY);
  }

  const legacyShuffle = localStorage.getItem(LEGACY_SHUFFLE_KEY);
  if (legacyShuffle === "true" && !settings.shuffleQuestions && !settings.shuffleOptions) {
    updates.shuffleQuestions = true;
    localStorage.removeItem(LEGACY_SHUFFLE_KEY);
  }

  if (Object.keys(updates).length === 0) {
    return settings;
  }

  await nativeApi.saveSettings(updates);
  return {
    ...settings,
    ...updates,
    shuffleQuestions: updates.shuffleQuestions ?? settings.shuffleQuestions,
    shuffleOptions: updates.shuffleOptions ?? settings.shuffleOptions,
  };
}

export async function loadAppSettings(): Promise<AppSettings> {
  if (!inflightSettings) {
    inflightSettings = loadAppSettingsImpl().finally(() => {
      inflightSettings = null;
    });
  }
  return inflightSettings;
}
