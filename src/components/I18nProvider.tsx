import { useMemo, type ReactNode } from "react";
import { setDateLocale } from "@/lib/formatDate";
import { I18nContext, type I18nValue } from "@/lib/i18n";
import { createTranslator } from "@/lib/i18n-messages";
import type { AppLocale } from "@/lib/locale";

export function I18nProvider({
  locale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(() => {
    setDateLocale(locale);
    return { locale, t: createTranslator(locale) };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
