import type { ReactNode } from "react";
import { toast } from "sonner";
import { QuizLibraryContext } from "@/contexts/quiz-library-context";
import { parseQuizFiles, type ParsedQuizLibrary } from "@/data/quizRepository";
import { useDirectoryLibrary } from "@/hooks/useDirectoryLibrary";
import type { ResolvedLibraryFile } from "@/lib/fileVersionCache";
import { errorMessage, nativeApi } from "@/lib/native";
import { useI18n } from "@/lib/i18n";

type QuizLibrary = ParsedQuizLibrary & { favoriteQuizIds: ReadonlySet<string> };
const EMPTY_LIBRARY: QuizLibrary = { quizzes: [], invalidReports: [], favoriteQuizIds: new Set() };

const readQuizMetadata = async (path: string) => {
  const [archivedQuizIds, favoriteQuizIds] = await Promise.all([
    nativeApi.listArchivedQuizIds(path), nativeApi.listFavoriteQuizIds(path),
  ]);
  return { archivedQuizIds, favoriteQuizIds };
};
const parseQuizLibrary = (files: ResolvedLibraryFile[], metadata: Awaited<ReturnType<typeof readQuizMetadata>>): QuizLibrary => ({
  ...parseQuizFiles(files, new Set(metadata.archivedQuizIds)),
  favoriteQuizIds: new Set(metadata.favoriteQuizIds),
});

export function QuizLibraryProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  const {
    library,
    setLibrary,
    refresh,
    isLoading,
    directoryPath,
    directoryAvailable,
    session,
  } = useDirectoryLibrary({
    empty: EMPTY_LIBRARY,
    readFiles: nativeApi.readWorkingDirectory,
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

  async function addSampleQuizzes(locale?: string) {
    const result = await nativeApi.addSampleQuizzes(locale);
    await refresh();
    return result;
  }

  async function setQuizArchived(quizId: string, archived: boolean) {
    if (!session?.isCurrent()) return false;
    try {
      await nativeApi.setQuizArchived(session.path, quizId, archived);
      if (!session.isCurrent()) return false;
      setQuizzes((current) =>
        current.map((source) =>
          source.quiz.id === quizId ? { ...source, archived } : source,
        ),
      );
      toast.success(t(archived ? "library.quizArchived" : "library.quizRestored"));
      return true;
    } catch (error) {
      await refresh({ background: true });
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function setQuizFavorite(quizId: string, favorite: boolean) {
    if (!session?.isCurrent()) return false;
    try {
      await nativeApi.setQuizFavorite(session.path, quizId, favorite);
      if (!session.isCurrent()) return false;
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
    if (!session?.isCurrent()) return false;
    try {
      await nativeApi.deleteQuizFile(session.path, fileName);
      if (!session.isCurrent()) return false;
      setQuizzes((current) => current.filter((source) => source.fileName !== fileName));
      toast.success(t("library.quizDeleted"));
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
