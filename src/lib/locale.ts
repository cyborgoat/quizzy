export const APP_LOCALES = ["en", "es", "zh"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "en" || value === "es" || value === "zh";
}

/** Best-effort UI/content locale from the OS / browser. */
export function detectSystemAppLocale(): AppLocale {
  const candidates = [
    ...(typeof navigator !== "undefined" ? navigator.languages ?? [] : []),
    typeof navigator !== "undefined" ? navigator.language : null,
  ].filter(Boolean) as string[];
  for (const tag of candidates) {
    const lower = tag.toLowerCase();
    if (lower === "zh" || lower.startsWith("zh-")) return "zh";
    if (lower === "es" || lower.startsWith("es-")) return "es";
    if (lower === "en" || lower.startsWith("en-")) return "en";
  }
  return "en";
}

export function localeDisplayName(locale: AppLocale) {
  switch (locale) {
    case "zh":
      return "简体中文";
    case "es":
      return "Español";
    default:
      return "English";
  }
}

/** BCP 47 tag for `<html lang>` and `Intl` date formatting. */
export function localeToBcp47(locale: AppLocale): string {
  switch (locale) {
    case "zh":
      return "zh-CN";
    case "es":
      return "es";
    default:
      return "en";
  }
}
