import { UiPreferencesContext } from "@/contexts/ui-preferences-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useUiPreferences = createContextHook(UiPreferencesContext, "UiPreferencesProvider");
