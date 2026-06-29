import { AppShortcutsContext } from "@/contexts/app-shortcuts-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useAppShortcuts = createContextHook(
  AppShortcutsContext,
  "AppSettingsProvider",
);
