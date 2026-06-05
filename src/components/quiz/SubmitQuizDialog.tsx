import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitQuizDialog({
  open,
  answeredCount,
  unansweredCount,
  flaggedCount,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  answeredCount: number;
  unansweredCount: number;
  flaggedCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/50"
        aria-label="Cancel quiz submission"
        onClick={onCancel}
      />
      <section
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-quiz-title"
      >
        <button
          type="button"
          className="absolute right-4 top-4 rounded-md p-1 text-zinc-500 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
          onClick={onCancel}
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
        <AlertTriangle className="size-8 text-amber-500" aria-hidden="true" />
        <h2 id="submit-quiz-title" className="mt-4 text-xl font-semibold text-zinc-950">
          Submit this quiz?
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Submission is final. Correct answers and explanations will be shown
          after you submit.
        </p>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
          <SummaryCount label="Answered" value={answeredCount} />
          <SummaryCount label="Unanswered" value={unansweredCount} />
          <SummaryCount label="Flagged" value={flaggedCount} />
        </dl>
        {unansweredCount > 0 && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Unanswered questions will be scored as incorrect.
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button ref={cancelButtonRef} variant="outline" onClick={onCancel}>
            Continue quiz
          </Button>
          <Button onClick={onConfirm}>Submit quiz</Button>
        </div>
      </section>
    </div>
  );
}

function SummaryCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-zinc-100 p-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-950">{value}</dd>
    </div>
  );
}
