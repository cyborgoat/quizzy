export type NativeLibraryFile = {
  fileName: string;
  contents: string;
  version?: string;
  unchanged?: boolean;
  readError?: string;
};

export type ResolvedLibraryFile = {
  fileName: string;
  contents: string;
  readError?: string;
};

type CachedEntry = { version: string; contents: string };

/**
 * Remembers file contents by version so the native side only has to re-read
 * files that changed. `resolve` turns a native listing (where unchanged files
 * carry no contents) into complete files and forgets files that disappeared.
 */
export function createFileVersionCache() {
  let entries = new Map<string, CachedEntry>();

  return {
    knownVersions(): Record<string, string> {
      return Object.fromEntries(
        [...entries].map(([fileName, entry]) => [fileName, entry.version]),
      );
    },

    resolve(files: NativeLibraryFile[]): ResolvedLibraryFile[] {
      const next = new Map<string, CachedEntry>();
      const resolved = files.map((file): ResolvedLibraryFile => {
        let contents = file.contents;
        if (file.unchanged) {
          const cached = entries.get(file.fileName);
          if (cached && cached.version === file.version) {
            contents = cached.contents;
          } else {
            // The cache lost this file; surface it rather than parsing empty text.
            return {
              fileName: file.fileName,
              contents: "",
              readError: "Cached contents were unavailable. Refresh to reload.",
            };
          }
        }
        if (file.version && !file.readError) {
          next.set(file.fileName, { version: file.version, contents });
        }
        return {
          fileName: file.fileName,
          contents,
          ...(file.readError ? { readError: file.readError } : {}),
        };
      });
      entries = next;
      return resolved;
    },

    clear() {
      entries = new Map();
    },
  };
}

export type FileVersionCache = ReturnType<typeof createFileVersionCache>;
