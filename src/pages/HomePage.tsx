import { Download, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/quiz/EmptyState";
import { QuizList } from "@/components/quiz/QuizList";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useUserProfile } from "@/hooks/useUserProfile";

export function HomePage() {
  const library = useQuizLibrary();
  const { userName } = useUserProfile();
  const navigate = useNavigate();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
          Hello, {userName || "there"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ready to practice? Pick a quiz below and get started.
        </p>
      </div>

      {library.isLoading && !library.directoryPath ? (
        <p className="py-20 text-center text-sm text-zinc-500">Loading Quizzy…</p>
      ) : !library.directoryAvailable ? (
        <EmptyState
          title={library.directoryPath ? "Working directory unavailable" : "No quiz directory set"}
          description={
            library.directoryPath
              ? "Quizzy could not access the configured directory. You can update it in Settings."
              : "Choose a working directory in Settings to get started."
          }
          actionLabel="Open Settings"
          onAction={() => navigate("/settings")}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">Local quiz library</p>
              <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-zinc-950">
                Choose a quiz
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void library.refresh()}>
                <RefreshCw className="size-4" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => void library.importQuizzes()}>
                <Download className="size-4" />
                Import JSON
              </Button>
            </div>
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
  );
}
