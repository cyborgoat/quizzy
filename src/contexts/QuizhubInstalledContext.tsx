import type { ReactNode } from "react";
import { QuizhubInstalledContext } from "@/contexts/quizhub-installed-context";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useQuizhubInstalled } from "@/hooks/useQuizhubInstalled";

export function QuizhubInstalledProvider({ children }: { children: ReactNode }) {
  const { directoryPath } = useQuizLibrary();
  const installed = useQuizhubInstalled(directoryPath);
  return (
    <QuizhubInstalledContext.Provider value={installed}>{children}</QuizhubInstalledContext.Provider>
  );
}
