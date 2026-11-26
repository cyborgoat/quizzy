import type { ReactNode } from "react";
import { QuizhubInstalledContext } from "@/contexts/quizhub-installed-context";
import { useQuizhubScope } from "@/hooks/useQuizhubScope";
import { useQuizhubInstalled } from "@/hooks/useQuizhubInstalled";

export function QuizhubInstalledProvider({ children }: { children: ReactNode }) {
  const installed = useQuizhubInstalled(useQuizhubScope());
  return (
    <QuizhubInstalledContext.Provider value={installed}>{children}</QuizhubInstalledContext.Provider>
  );
}
