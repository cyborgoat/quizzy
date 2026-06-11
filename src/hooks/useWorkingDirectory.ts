import { WorkingDirectoryContext } from "@/contexts/working-directory-context";
import { createContextHook } from "@/hooks/createContextHook";

export const useWorkingDirectory = createContextHook(
  WorkingDirectoryContext,
  "WorkingDirectoryProvider",
);
