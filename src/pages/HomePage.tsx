import {
  Download,
  FolderCog,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/quiz/EmptyState";
import { QuizList } from "@/components/quiz/QuizList";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";

export function HomePage() {
  const library = useQuizLibrary();

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-zinc-950">Quizzy</h1>
              <p className="max-w-md truncate text-sm text-zinc-500">
                {library.directoryPath ?? "Choose a local quiz directory"}
              </p>
            </div>
          </div>
          {library.directoryAvailable && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void library.refresh()}>
                <RefreshCw className="size-4" /> Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => void library.chooseWorkingDirectory()}>
                <FolderCog className="size-4" /> Change folder
              </Button>
              <Button size="sm" onClick={() => void library.importQuizzes()}>
                <Download className="size-4" /> Import JSON
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {library.notice && (
          <Alert
            className="mb-6"
            variant={library.notice.kind === "error" ? "destructive" : "success"}
          >
            <div className="flex items-start justify-between gap-4">
              <AlertDescription>{library.notice.text}</AlertDescription>
              <button
                type="button"
                className="text-xs font-semibold underline"
                onClick={library.clearNotice}
              >
                Dismiss
              </button>
            </div>
          </Alert>
        )}

        {library.isLoading && !library.directoryPath ? (
          <p className="py-20 text-center text-sm text-zinc-500">Loading Quizzy…</p>
        ) : !library.directoryAvailable ? (
          <EmptyState
            title={library.directoryPath ? "Working directory unavailable" : "Choose a working directory"}
            description={
              library.directoryPath
                ? `Quizzy could not access ${library.directoryPath}. Reconnect the drive or choose another folder.`
                : "Quizzy stores no quiz database. Select a folder containing top-level quiz JSON files, or choose an empty folder and import your quizzes."
            }
            actionLabel="Choose directory"
            onAction={() => void library.chooseWorkingDirectory()}
          />
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Local quiz library</p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950">
                  Choose a quiz
                </h2>
              </div>
              <p className="text-sm text-zinc-500">
                {library.quizzes.length} valid quiz{library.quizzes.length === 1 ? "" : "zes"}
              </p>
            </div>

            {library.invalidReports.length > 0 && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>
                  {library.invalidReports.length} invalid quiz file(s) were skipped
                </AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-2">
                    {library.invalidReports.map((report) => (
                      <li key={report.fileName}>
                        <strong>{report.fileName}:</strong> {report.issues.join(" ")}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {library.quizzes.length > 0 ? (
              <QuizList quizzes={library.quizzes} onDelete={(quiz) => void library.deleteQuiz(quiz)} />
            ) : (
              <EmptyState
                title="No valid quizzes yet"
                description="Import one or more quiz JSON files into this working directory."
                actionLabel="Import JSON files"
                onAction={() => void library.importQuizzes()}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
