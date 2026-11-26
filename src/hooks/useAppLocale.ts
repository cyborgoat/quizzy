import { LocaleContext } from "@/contexts/locale-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useAppLocale = createContextHook(LocaleContext, "useAppLocale");
