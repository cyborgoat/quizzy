import { QuizhubPreferencesContext } from "@/contexts/quizhub-preferences-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useQuizhubPreferences = createContextHook(
  QuizhubPreferencesContext,
  "AppSettingsProvider",
);
