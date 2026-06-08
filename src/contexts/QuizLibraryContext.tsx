import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { confirm, open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { QuizLibraryContext } from "@/contexts/quiz-library-context";
import { parseQuizFiles } from "@/data/quizRepository";
import { sameFileName } from "@/lib/fileName";
import { errorMessage, nativeApi } from "@/lib/native";
import type { InvalidQuizReport, QuizSource } from "@/types/quiz";

export function QuizLibraryProvider({ children }: { children: ReactNode }) {
  const [directoryPath, setDirectoryPath] = useState<string | null>(null);
  const [directoryAvailable, setDirectoryAvailable] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizSource[]>([]);
  const [invalidReports, setInvalidReports] = useState<InvalidQuizReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    function handleFocus() {
      void refresh();
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refresh]);

  async function importQuizzes() {
    try {
      const selected = await open({
        multiple: true,
        directory: false,
        title: "Import quiz JSON files",
        filters: [{ name: "Quiz JSON", extensions: ["json"] }],
      });
      if (!selected) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      const files = await nativeApi.readImportFiles(paths);
      const parsed = parseQuizFiles(files);
      if (parsed.quizzes.length === 0) {
        toast.error(`${parsed.invalidReports.length || files.length} file(s) were invalid. Nothing was imported.`);
        return;
      }

      const conflicts = parsed.quizzes
        .map((candidate) => {
          const fileConflict = quizzes.find((existing) =>
            sameFileName(existing.fileName, candidate.fileName),
          );
          const invalidFileConflict = invalidReports.some((report) =>
            sameFileName(report.fileName, candidate.fileName),
          );
          const idConflict = quizzes.find(
            (existing) => existing.quiz.id === candidate.quiz.id,
          );
          return { candidate, fileConflict, invalidFileConflict, idConflict };
        })
        .filter(
          ({ fileConflict, invalidFileConflict, idConflict }) =>
            fileConflict || invalidFileConflict || idConflict,
        );

      if (conflicts.length > 0) {
        const approved = await confirm(
          `${conflicts.length} imported quiz file(s) conflict with existing quizzes. Replace the existing quizzes?`,
          { title: "Replace existing quizzes?", kind: "warning" },
        );
        if (!approved) return;
      }

      for (const candidate of parsed.quizzes) {
        const fileConflict = quizzes.find((existing) =>
          sameFileName(existing.fileName, candidate.fileName),
        );
        const invalidFileConflict = invalidReports.some((report) =>
          sameFileName(report.fileName, candidate.fileName),
        );
        const idConflict = quizzes.find(
          (existing) => existing.quiz.id === candidate.quiz.id,
        );
        await nativeApi.writeImportedQuiz({
          fileName: candidate.fileName,
          contents: files.find((file) => sameFileName(file.fileName, candidate.fileName))!.contents,
          overwrite: Boolean(fileConflict || invalidFileConflict),
          removeFileName:
            idConflict && !sameFileName(idConflict.fileName, candidate.fileName)
              ? idConflict.fileName
              : undefined,
        });
      }

      const replaced = conflicts.length;
      const invalid = parsed.invalidReports.length;
      toast.success(
        `Imported ${parsed.quizzes.length} quiz file(s)${replaced ? `, replacing ${replaced}` : ""}${invalid ? `; skipped ${invalid} invalid file(s)` : ""}.`,
      );
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function deleteQuiz(source: QuizSource) {
    const approved = await confirm(
      `Delete "${source.quiz.title}" from the working directory? This cannot be undone.`,
      { title: "Delete quiz?", kind: "warning" },
    );
    if (!approved) return;
    try {
      await nativeApi.deleteQuizFile(source.fileName);
      toast.success(`"${source.quiz.title}" was deleted.`);
      await refresh();
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
    importQuizzes,
    deleteQuiz,
  };

  return (
    <QuizLibraryContext.Provider value={value}>
      {children}
    </QuizLibraryContext.Provider>
  );
}
