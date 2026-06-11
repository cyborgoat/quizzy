import { useCallback, useState } from "react";
import { useGoals } from "@/hooks/useGoals";
import { useKnowledgeLibrary } from "@/hooks/useKnowledgeLibrary";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import { errorMessage, nativeApi, type SyncReport } from "@/lib/native";

export function useAppSynchronize() {
  const { refresh: refreshWorkingDirectory } = useWorkingDirectory();
  const quizLibrary = useQuizLibrary();
  const knowledgeLibrary = useKnowledgeLibrary();
  const { refreshAfterSync } = useGoals();
  const [isSyncing, setIsSyncing] = useState(false);

  const synchronizeAll = useCallback(async (): Promise<SyncReport> => {
    setIsSyncing(true);
    try {
      const report = await nativeApi.synchronizeAppData();
      await Promise.all([
        refreshWorkingDirectory(),
        quizLibrary.refresh({ background: true }),
        knowledgeLibrary.refresh({ background: true }),
        refreshAfterSync(),
      ]);
      return report;
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error });
    } finally {
      setIsSyncing(false);
    }
  }, [
    refreshWorkingDirectory,
    quizLibrary,
    knowledgeLibrary,
    refreshAfterSync,
  ]);

  return { synchronizeAll, isSyncing };
}
