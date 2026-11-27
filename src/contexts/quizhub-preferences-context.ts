import { createContext } from "react";

export type QuizhubPreferencesContextValue = {
  quizhubEnabled: boolean;
  setQuizhubEnabled: (enabled: boolean) => void;
  /** Effective quizhub source URL (custom override or default). */
  quizhubBaseUrl: string;
  setQuizhubBaseUrl: (baseUrl: string) => void;
  /** Build-time default catalog URL; empty until settings load. */
  quizhubDefaultBaseUrl: string;
};

export const QuizhubPreferencesContext =
  createContext<QuizhubPreferencesContextValue | null>(null);
