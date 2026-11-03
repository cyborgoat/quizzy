import type { ReactNode } from "react";
import { toast } from "sonner";
import { QuizLibraryContext } from "@/contexts/quiz-library-context";
import { parseQuizFiles, type ParsedQuizLibrary } from "@/data/quizRepository";
import { useDirectoryLibrary } from "@/hooks/useDirectoryLibrary";
import type { ResolvedLibraryFile } from "@/lib/fileVersionCache";
import { errorMessage, nativeApi } from "@/lib/native";

const EMPTY_LIBRARY: ParsedQuizLibrary = { quizzes: [], invalidReports: [] };

const readQuizFiles = (knownVersions: Record<string, string>) =>
  nativeApi.readWorkingDirectory(knownVersions);
const readArchivedQuizIds = () => nativeApi.listArchivedQuizIds();
const parseQuizLibrary = (files: ResolvedLibraryFile[], archivedQuizIds: string[]) =>
  parseQuizFiles(files, new Set(archivedQuizIds));

export function QuizLibraryProvider({ children }: { children: ReactNode }) {
  const {
    library,
    setLibrary,
    refresh,
    isLoading,
    directoryPath,
    directoryAvailable,
  } = useDirectoryLibrary({
    empty: EMPTY_LIBRARY,
    readFiles: readQuizFiles,
    readExtras: readArchivedQuizIds,
    parse: parseQuizLibrary,
    label: "quiz",
  });
  const { quizzes, invalidReports } = library;

  function setQuizzes(update: (current: typeof quizzes) => typeof quizzes) {
    setLibrary((current) => ({ ...current, quizzes: update(current.quizzes) }));
  }

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

  async function addSampleQuizzes() {
    const result = await nativeApi.addSampleQuizzes();
    await refresh();
    return result;
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
    addSampleQuizzes,
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
