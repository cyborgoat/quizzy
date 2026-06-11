import { AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/dialog";

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
  return (
    <ConfirmDialog
      open={open}
      leading={<AlertTriangle className="size-8 text-amber-500" aria-hidden="true" />}
      title="Submit this quiz?"
      description="Submission is final. Correct answers and explanations will be shown after you submit."
      cancelLabel="Continue quiz"
      confirmLabel="Submit quiz"
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
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
    </ConfirmDialog>
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
