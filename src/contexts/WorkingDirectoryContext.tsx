import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { WorkingDirectoryContext, type LibrarySession } from "@/contexts/working-directory-context";
import { errorMessage, nativeApi } from "@/lib/native";

export function WorkingDirectoryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState({
    directoryPath: null as string | null,
    directoryAvailable: false,
    session: null as LibrarySession | null,
  });
  const request = useRef(0);
  const activeSession = useRef<LibrarySession | null>(null);

  const refresh = useCallback(async () => {
    const id = ++request.current;
    try {
      const settings = await nativeApi.getSettings();
      if (id !== request.current) return;
      const path = settings.workingDirectoryAvailable ? settings.workingDirectory : null;
      if (!path) {
        activeSession.current = null;
      } else if (activeSession.current?.path !== path) {
        const session: LibrarySession = { path, isCurrent: () => activeSession.current === session };
        activeSession.current = session;
      }
      setLibrary({
        directoryPath: settings.workingDirectory,
        directoryAvailable: settings.workingDirectoryAvailable,
        session: activeSession.current,
      });
    } catch (error) {
      if (id !== request.current) return;
      activeSession.current = null;
      setLibrary((current) => ({ ...current, directoryAvailable: false, session: null }));
      toast.error(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    void refresh();
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
      value={{ ...library, refresh }}
    >
      {children}
    </WorkingDirectoryContext.Provider>
  );
}
