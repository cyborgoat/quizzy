import { createContext } from "react";

export type UiPreferencesContextValue = {
  fontSize: number;
  setFontSize: (value: number) => void;
};

export const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);
