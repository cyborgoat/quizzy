import { useContext } from "react";
import { MistakeLogSettingsContext } from "@/contexts/mistake-log-settings-context";

export function useMistakeLogSettings() {
  const context = useContext(MistakeLogSettingsContext);
  if (!context) {
    throw new Error("useMistakeLogSettings must be used within MistakeLogSettingsProvider.");
  }
  return context;
}
