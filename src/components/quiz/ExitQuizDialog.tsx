import { AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/dialog";

export function ExitQuizDialog({
  open,
  answeredCount,
  totalQuestions,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  answeredCount: number;
  totalQuestions: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      leading={<AlertTriangle className="size-8 text-amber-500" aria-hidden="true" />}
      title="Leave this quiz?"
      description="Going back to home will end your current attempt. Any answers you have entered so far will not be saved."
      cancelLabel="Continue"
      confirmLabel="Leave"
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {answeredCount > 0 && (
        <p className="mt-4 rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700">
          You have answered {answeredCount} of {totalQuestions} questions.
        </p>
      )}
    </ConfirmDialog>
  );
}
