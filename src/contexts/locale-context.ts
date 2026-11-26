import { createContext } from "react";
import type { AppLocale } from "@/lib/locale";

export type LocaleContextValue = {
  /** Effective UI locale (falls back to detected system locale before first choice). */
  locale: AppLocale;
  /** True after the user has saved an app language preference. */
  localeConfigured: boolean;
  /** True after settings.json has been loaded once. */
  settingsReady: boolean;
  /** True after the first-launch wizard has been finished. */
  onboardingCompleted: boolean;
  setAppLocale: (locale: AppLocale) => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

export const LocaleContext = createContext<LocaleContextValue | null>(null);
