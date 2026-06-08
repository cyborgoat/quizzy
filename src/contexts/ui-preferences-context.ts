import { createContext } from "react";
import type { UiDensity } from "@/lib/uiPreferences";

export type UiPreferencesContextValue = {
  fontSize: number;
  density: UiDensity;
  setFontSize: (value: number) => void;
  setDensity: (value: UiDensity) => void;
};

export const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);
