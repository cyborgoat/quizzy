import { createContext, useContext } from "react";

export type QuizhubInstalled = {
  quizzes: ReadonlySet<string>;
  notes: ReadonlySet<string>;
};

const empty: QuizhubInstalled = { quizzes: new Set(), notes: new Set() };

export const QuizhubInstalledContext = createContext<QuizhubInstalled>(empty);

/** File names downloaded from quizhub; empty outside the provider. */
export function useQuizhubInstalledFiles() {
  return useContext(QuizhubInstalledContext);
}
