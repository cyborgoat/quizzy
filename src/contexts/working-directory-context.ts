import { createContext } from "react";

export type LibrarySession = {
  path: string;
  isCurrent: () => boolean;
};

export type WorkingDirectoryContextValue = {
  directoryPath: string | null;
  directoryAvailable: boolean;
  session: LibrarySession | null;
  refresh: () => Promise<void>;
};

export const WorkingDirectoryContext = createContext<WorkingDirectoryContextValue | null>(null);
