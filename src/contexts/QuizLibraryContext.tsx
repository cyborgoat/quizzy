import { useCallback, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { QuizLibraryContext } from "@/contexts/quiz-library-context";
import { parseQuizFiles } from "@/data/quizRepository";
import { useBackgroundDataLoader } from "@/hooks/useBackgroundDataLoader";
import { errorMessage, nativeApi } from "@/lib/native";
import type { InvalidQuizReport, QuizSource } from "@/types/quiz";

export function QuizLibraryProvider({ children }: { children: ReactNode }) {
  const [directoryPath, setDirectoryPath] = useState<string | null>(null);
  const [directoryAvailable, setDirectoryAvailable] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizSource[]>([]);
  const [invalidReports, setInvalidReports] = useState<InvalidQuizReport[]>([]);

  const load = useCallback(async () => {
    try {
      const settings = await nativeApi.getSettings();
      setDirectoryPath(settings.workingDirectory);
      setDirectoryAvailable(settings.workingDirectoryAvailable);
      if (!settings.workingDirectoryAvailable) {
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
      setDirectoryAvailable(false);
      toast.error(errorMessage(error));
    }
  }, []);

  const { refresh, isLoading } = useBackgroundDataLoader(load);

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
