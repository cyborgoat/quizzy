import { MistakeLogSettingsContext } from "@/contexts/mistake-log-settings-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useMistakeLogSettings = createContextHook(
  MistakeLogSettingsContext,
  "MistakeLogSettingsProvider",
);
