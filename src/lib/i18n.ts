import { createContext, useContext } from "react";
import type { AppLocale } from "@/lib/locale";
import { createTranslator, type MessageKey, type TFunction } from "@/lib/i18n-messages";

export type { MessageKey, TFunction };

export type I18nValue = {
  locale: AppLocale;
  t: TFunction;
};

const defaultValue: I18nValue = { locale: "en", t: createTranslator("en") };

export const I18nContext = createContext<I18nValue>(defaultValue);

export function useI18n() {
  return useContext(I18nContext);
}
