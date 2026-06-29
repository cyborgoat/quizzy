import { nativeApi, type AppSettings } from "@/lib/native";

let inflightSettings: Promise<AppSettings> | null = null;

// Legacy localStorage keys (quizzy:profile:name, quizzy:preferences:shuffle-mode)
// were migrated in earlier releases and are no longer read here.

export async function loadAppSettings(): Promise<AppSettings> {
  if (!inflightSettings) {
    inflightSettings = nativeApi.getSettings().finally(() => {
      inflightSettings = null;
    });
  }
  return inflightSettings;
}
