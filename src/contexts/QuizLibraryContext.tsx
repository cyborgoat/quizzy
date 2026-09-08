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
      const [files, archivedQuizIds] = await Promise.all([
        nativeApi.readWorkingDirectory(),
        nativeApi.listArchivedQuizIds(),
      ]);
      const library = parseQuizFiles(files, new Set(archivedQuizIds));
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

  async function importQuizFile(sourcePath: string) {
    const fileName = await nativeApi.importQuizFile(sourcePath);
    await refresh();
    return fileName;
  }

  async function setQuizArchived(quizId: string, archived: boolean) {
    try {
      await nativeApi.setQuizArchived(quizId, archived);
      setQuizzes((current) =>
        current.map((source) =>
          source.quiz.id === quizId ? { ...source, archived } : source,
        ),
      );
      toast.success(archived ? "Quiz archived." : "Quiz restored.");
      return true;
    } catch (error) {
      await refresh({ background: true });
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function deleteQuizFile(fileName: string) {
    try {
      await nativeApi.deleteQuizFile(fileName);
      setQuizzes((current) => current.filter((source) => source.fileName !== fileName));
      toast.success("Quiz permanently deleted.");
      return true;
    } catch (error) {
      await refresh({ background: true });
      toast.error(errorMessage(error));
      return false;
    }
  }

  const value = {
    directoryPath,
    directoryAvailable,
    quizzes,
    invalidReports,
    isLoading,
    refresh,
    importQuizFile,
    setQuizArchived,
    deleteQuizFile,
    openQuizFolder,
  };

  return (
    <QuizLibraryContext.Provider value={value}>
      {children}
    </QuizLibraryContext.Provider>
  );
}
