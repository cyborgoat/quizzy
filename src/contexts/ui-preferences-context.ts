import { createContext } from "react";

export type UiPreferencesContextValue = {
  fontSize: number;
};

export const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);
