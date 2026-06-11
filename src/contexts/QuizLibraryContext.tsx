import { useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { QuizLibraryContext } from "@/contexts/quiz-library-context";
import { parseQuizFiles } from "@/data/quizRepository";
import { useBackgroundDataLoader } from "@/hooks/useBackgroundDataLoader";
import { useWorkingDirectory } from "@/hooks/useWorkingDirectory";
import { errorMessage, nativeApi } from "@/lib/native";
import type { InvalidQuizReport, QuizSource } from "@/types/quiz";

export function QuizLibraryProvider({ children }: { children: ReactNode }) {
  const { directoryPath, directoryAvailable } = useWorkingDirectory();
  const [quizzes, setQuizzes] = useState<QuizSource[]>([]);
  const [invalidReports, setInvalidReports] = useState<InvalidQuizReport[]>([]);

  const load = useCallback(async () => {
    try {
      if (!directoryAvailable || !directoryPath) {
        setQuizzes([]);
        setInvalidReports([]);
        return;
      }
      const files = await nativeApi.readWorkingDirectory();
      const library = parseQuizFiles(files);
      setQuizzes(library.quizzes);
      setInvalidReports(library.invalidReports);
      if (import.meta.env.DEV && library.invalidReports.length > 0) {
        console.warn("Quizzy skipped invalid quiz files:", library.invalidReports);
      }
    } catch (error) {
      setQuizzes([]);
      setInvalidReports([]);
      toast.error(errorMessage(error));
    }
  }, [directoryAvailable, directoryPath]);

  const { refresh, isLoading } = useBackgroundDataLoader(load);

  useEffect(() => {
    void refresh({ background: true });
  }, [directoryAvailable, directoryPath, refresh]);

  async function openQuizFolder() {
    try {
      await nativeApi.openQuizFolder();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const value = {
    directoryPath,
    directoryAvailable,
    quizzes,
    invalidReports,
    isLoading,
    refresh,
    openQuizFolder,
  };

  return (
    <QuizLibraryContext.Provider value={value}>
      {children}
    </QuizLibraryContext.Provider>
  );
}
