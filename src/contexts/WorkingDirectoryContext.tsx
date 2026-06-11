import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { WorkingDirectoryContext } from "@/contexts/working-directory-context";
import { errorMessage, nativeApi } from "@/lib/native";

export function WorkingDirectoryProvider({ children }: { children: ReactNode }) {
  const [directoryPath, setDirectoryPath] = useState<string | null>(null);
  const [directoryAvailable, setDirectoryAvailable] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const settings = await nativeApi.getSettings();
      setDirectoryPath(settings.workingDirectory);
      setDirectoryAvailable(settings.workingDirectoryAvailable);
    } catch (error) {
      setDirectoryAvailable(false);
      toast.error(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- load directory settings on mount */
    void refresh();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [refresh]);

  useEffect(() => {
    function handleFocus() {
      void refresh();
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  return (
    <WorkingDirectoryContext.Provider
      value={{ directoryPath, directoryAvailable, refresh }}
    >
      {children}
    </WorkingDirectoryContext.Provider>
  );
}
