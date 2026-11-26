import { useMemo } from "react";
import { useQuizhubPreferences } from "@/hooks/useQuizhubPreferences";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import type { HubScope } from "@/lib/native";

export function useQuizhubScope(): HubScope | null {
  const { session } = useWorkingDirectory();
  const { quizhubBaseUrl } = useQuizhubPreferences();
  return useMemo(() => session && {
    workingDirectory: session.path,
    baseUrl: quizhubBaseUrl,
  }, [session, quizhubBaseUrl]);
}
