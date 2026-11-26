import { AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

  return (
    <ConfirmDialog
      open={open}
      leading={<AlertTriangle className="size-8 text-amber-500" aria-hidden="true" />}
      title={t("submit.title")}
      description={t("submit.description")}
      cancelLabel={t("submit.cancel")}
      confirmLabel={t("common.submit")}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <dl className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
        <SummaryCount label={t("submit.answered")} value={answeredCount} />
        <SummaryCount label={t("submit.unanswered")} value={unansweredCount} />
        <SummaryCount label={t("submit.flagged")} value={flaggedCount} />
      </dl>
      {unansweredCount > 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          {t("submit.unansweredNote")}
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
