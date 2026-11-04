import type { ReactNode } from "react";
import { toast } from "sonner";
import { QuizLibraryContext } from "@/contexts/quiz-library-context";
import { parseQuizFiles, type ParsedQuizLibrary } from "@/data/quizRepository";
import { useDirectoryLibrary } from "@/hooks/useDirectoryLibrary";
import type { ResolvedLibraryFile } from "@/lib/fileVersionCache";
import { errorMessage, nativeApi } from "@/lib/native";

type QuizLibrary = ParsedQuizLibrary & { favoriteQuizIds: ReadonlySet<string> };
const EMPTY_LIBRARY: QuizLibrary = { quizzes: [], invalidReports: [], favoriteQuizIds: new Set() };

const readQuizFiles = (knownVersions: Record<string, string>) =>
  nativeApi.readWorkingDirectory(knownVersions);
const readQuizMetadata = async () => {
  const [archivedQuizIds, favoriteQuizIds] = await Promise.all([
    nativeApi.listArchivedQuizIds(), nativeApi.listFavoriteQuizIds(),
  ]);
  return { archivedQuizIds, favoriteQuizIds };
};
const parseQuizLibrary = (files: ResolvedLibraryFile[], metadata: Awaited<ReturnType<typeof readQuizMetadata>>): QuizLibrary => ({
  ...parseQuizFiles(files, new Set(metadata.archivedQuizIds)),
  favoriteQuizIds: new Set(metadata.favoriteQuizIds),
});

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
    readExtras: readQuizMetadata,
    parse: parseQuizLibrary,
    label: "quiz",
  });
  const { quizzes, invalidReports, favoriteQuizIds } = library;

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

  async function setQuizFavorite(quizId: string, favorite: boolean) {
    try {
      await nativeApi.setQuizFavorite(quizId, favorite);
      setLibrary((current) => {
        const next = new Set(current.favoriteQuizIds);
        if (favorite) next.add(quizId);
        else next.delete(quizId);
        return { ...current, favoriteQuizIds: next };
      });
      return true;
    } catch (error) {
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
    favoriteQuizIds,
    setQuizFavorite,
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
