import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useBackgroundDataLoader } from "@/hooks/useBackgroundDataLoader";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import {
  createFileVersionCache,
  type NativeLibraryFile,
  type ResolvedLibraryFile,
} from "@/lib/fileVersionCache";
import { errorMessage } from "@/lib/native";

type LibraryOptions<T extends { invalidReports: unknown[] }, E> = {
  /** Value used before the first load and whenever the directory is unavailable. */
  empty: T;
  /** Reads the directory natively; unchanged files carry no contents. */
  readFiles: (knownVersions: Record<string, string>) => Promise<NativeLibraryFile[]>;
  /** Optional extra data loaded alongside the files (e.g. archived quiz ids). */
  readExtras?: () => Promise<E>;
  parse: (files: ResolvedLibraryFile[], extras: E) => T;
  /** Used in the dev-only warning about skipped files. */
  label: string;
};

/**
 * Shared loader for libraries backed by files in the working directory:
 * handles directory changes, the file-version cache, parse results,
 * background refreshes and error reporting.
 *
 * Pass module-level (stable) functions in `options`.
 */
export function useDirectoryLibrary<T extends { invalidReports: unknown[] }, E = undefined>(
  options: LibraryOptions<T, E>,
) {
  const { empty, readFiles, readExtras, parse, label } = options;
  const { directoryPath, directoryAvailable } = useWorkingDirectory();
  const [library, setLibrary] = useState<T>(empty);
  const fileCache = useRef(createFileVersionCache());
  const cachedDirectory = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      if (!directoryAvailable || !directoryPath) {
        fileCache.current.clear();
        setLibrary(empty);
        return;
      }
      if (cachedDirectory.current !== directoryPath) {
        fileCache.current.clear();
        cachedDirectory.current = directoryPath;
      }
      const [nativeFiles, extras] = await Promise.all([
        readFiles(fileCache.current.knownVersions()),
        readExtras ? readExtras() : (undefined as E),
      ]);
      const parsed = parse(fileCache.current.resolve(nativeFiles), extras);
      setLibrary(parsed);
      if (import.meta.env.DEV && parsed.invalidReports.length > 0) {
        console.warn(`Quizzy skipped invalid ${label} files:`, parsed.invalidReports);
      }
    } catch (error) {
      fileCache.current.clear();
      setLibrary(empty);
      toast.error(errorMessage(error));
    }
  }, [directoryAvailable, directoryPath, empty, readFiles, readExtras, parse, label]);

  // useBackgroundDataLoader reloads whenever `load` changes (directory switch), so no extra effect.
  const { refresh, isLoading } = useBackgroundDataLoader(load);

  return { library, setLibrary, refresh, isLoading, directoryPath, directoryAvailable };
}
