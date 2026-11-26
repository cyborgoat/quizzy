import type { AppLocale } from "@/lib/locale";

let activeLocale: AppLocale = "en";

/** Called by I18nProvider so date helpers follow the app language. */
export function setDateLocale(locale: AppLocale) {
  activeLocale = locale;
}

export function dateLocaleTag(): string {
  return activeLocale === "zh" ? "zh-CN" : "en-US";
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(dateLocaleTag(), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString(dateLocaleTag(), {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(dateLocaleTag());
}

export function formatTimeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString(dateLocaleTag(), {
    hour: "numeric",
    minute: "2-digit",
  });
}
