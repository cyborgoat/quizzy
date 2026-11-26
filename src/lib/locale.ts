export const APP_LOCALES = ["en", "zh"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "en" || value === "zh";
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
    if (lower === "en" || lower.startsWith("en-")) return "en";
  }
  return "en";
}

export function localeDisplayName(locale: AppLocale) {
  return locale === "zh" ? "简体中文" : "English";
}
