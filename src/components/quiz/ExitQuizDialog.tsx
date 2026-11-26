import { AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

  return (
    <ConfirmDialog
      open={open}
      leading={<AlertTriangle className="size-8 text-amber-500" aria-hidden="true" />}
      title={t("exit.title")}
      description={t("exit.description")}
      cancelLabel={t("submit.cancel")}
      confirmLabel={t("exit.confirm")}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {answeredCount > 0 && (
        <p className="mt-4 rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700">
          {t("exit.progress", { answered: answeredCount, total: totalQuestions })}
        </p>
      )}
    </ConfirmDialog>
  );
}
