import { createContext } from "react";
import type { UiDensity, UiFontSize } from "@/lib/uiPreferences";

export type UiPreferencesContextValue = {
  fontSize: UiFontSize;
  density: UiDensity;
  setFontSize: (value: UiFontSize) => void;
  setDensity: (value: UiDensity) => void;
};

export const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);
