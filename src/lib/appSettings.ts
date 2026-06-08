import { nativeApi, type AppSettings } from "@/lib/native";

const LEGACY_NAME_KEY = "quizzy:profile:name";
const LEGACY_SHUFFLE_KEY = "quizzy:preferences:shuffle-mode";

export async function loadAppSettings(): Promise<AppSettings> {
  const settings = await nativeApi.getSettings();
  const updates: {
    profileName?: string;
    shuffleMode?: boolean;
  } = {};

  const legacyName = localStorage.getItem(LEGACY_NAME_KEY);
  if (legacyName && !settings.profileName) {
    updates.profileName = legacyName;
    localStorage.removeItem(LEGACY_NAME_KEY);
  }

  const legacyShuffle = localStorage.getItem(LEGACY_SHUFFLE_KEY);
  if (legacyShuffle === "true" && !settings.shuffleMode) {
    updates.shuffleMode = true;
    localStorage.removeItem(LEGACY_SHUFFLE_KEY);
  }

  if (Object.keys(updates).length === 0) {
    return settings;
  }

  await nativeApi.saveSettings(updates);
  return { ...settings, ...updates };
}
