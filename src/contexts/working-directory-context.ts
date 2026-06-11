import { createContext } from "react";

export type WorkingDirectoryContextValue = {
  directoryPath: string | null;
  directoryAvailable: boolean;
  refresh: () => Promise<void>;
};

export const WorkingDirectoryContext = createContext<WorkingDirectoryContextValue | null>(null);
