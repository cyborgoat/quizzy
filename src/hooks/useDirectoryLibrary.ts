import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { LibrarySession } from "@/contexts/working-directory-context";
import { useBackgroundDataLoader } from "@/hooks/useBackgroundDataLoader";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import {
  createFileVersionCache,
  type NativeLibraryFile,
  type ResolvedLibraryFile,
} from "@/lib/fileVersionCache";
import { errorMessage } from "@/lib/native";

type LibraryOptions<T extends { invalidReports: unknown[] }, E> = {
  empty: T;
  readFiles: (path: string, knownVersions: Record<string, string>) => Promise<NativeLibraryFile[]>;
  readExtras?: (path: string) => Promise<E>;
  parse: (files: ResolvedLibraryFile[], extras: E) => T;
  label: string;
};

/** Shares file and metadata loading for libraries backed by the working directory. */
export function useDirectoryLibrary<T extends { invalidReports: unknown[] }, E = undefined>(
  options: LibraryOptions<T, E>,
) {
  const { empty, readFiles, readExtras, parse, label } = options;
  const { directoryPath, directoryAvailable, session } = useWorkingDirectory();
  const [snapshot, setSnapshot] = useState<{ session: LibrarySession; library: T } | null>(null);
  const current = snapshot?.session === session ? snapshot : null;
  const fileCache = useMemo(() => session && createFileVersionCache(), [session]);

  const setLibrary = useCallback((update: (current: T) => T) => {
    if (!session?.isCurrent()) return;
    setSnapshot((previous) => ({
      session,
      library: update(previous?.session === session ? previous.library : empty),
    }));
  }, [empty, session]);

  const load = useCallback(async () => {
    if (!fileCache || !session?.isCurrent()) return;
    try {
      const [nativeFiles, extras] = await Promise.all([
        readFiles(session.path, fileCache.knownVersions()),
        readExtras ? readExtras(session.path) : (undefined as E),
      ]);
      if (!session.isCurrent()) return;
      const library = parse(fileCache.resolve(nativeFiles), extras);
      setSnapshot({ session, library });
      if (import.meta.env.DEV && library.invalidReports.length > 0) {
        console.warn(`Quizzy skipped invalid ${label} files:`, library.invalidReports);
      }
    } catch (error) {
      if (!session.isCurrent()) return;
      fileCache.clear();
      setSnapshot({ session, library: empty });
      toast.error(errorMessage(error));
    }
  }, [session, fileCache, empty, readFiles, readExtras, parse, label]);

  const { refresh, isLoading } = useBackgroundDataLoader(load);
  return {
    library: current?.library ?? empty,
    setLibrary,
    refresh,
    isLoading: Boolean(session) && (isLoading || !current),
    directoryPath,
    directoryAvailable,
    session,
  };
}
