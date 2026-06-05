import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function QuizActionBar({
  submitted,
  isLast,
  error,
  onSubmit,
  onNext,
}: {
  submitted: boolean;
  isLast: boolean;
  error: string | null;
  onSubmit: () => void;
  onNext: () => void;
}) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1" aria-live="polite">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <Button onClick={submitted ? onNext : onSubmit}>
          {submitted ? (isLast ? "Finish quiz" : "Next question") : "Submit answer"}
        </Button>
      </div>
    </footer>
  );
}
