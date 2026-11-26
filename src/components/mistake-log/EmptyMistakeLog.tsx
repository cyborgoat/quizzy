import { Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/quiz/EmptyState";
import { buttonClassName } from "@/components/ui/button-styles";
import type { MistakeLogThresholds } from "@/types/mistakeLog";
import { useI18n } from "@/lib/i18n";

export function EmptyMistakeLog({
  reason,
  thresholds,
}: {
  reason: "no_attempts" | "no_mistakes" | "thresholds_exclude_all";
  thresholds: MistakeLogThresholds;
}) {
  const { t } = useI18n();

  if (reason === "no_attempts") {
    return (
      <EmptyState
        title={t("mistakes.emptyState.noAttemptsTitle")}
        description={t("mistakes.emptyState.noAttemptsDescription")}
      />
    );
  }

  if (reason === "no_mistakes") {
    return (
      <EmptyState
        title={t("mistakes.emptyState.noMistakesTitle")}
        description={t("mistakes.emptyState.noMistakesDescription")}
      />
    );
  }

  return (
    <EmptyState
      title={t("mistakes.emptyState.thresholdsTitle")}
      description={t("mistakes.emptyState.thresholdsDescription", {
        minMistakes: thresholds.minMistakes,
        maxCorrectness: thresholds.maxCorrectnessPercentage,
        minFlags: thresholds.minFlags,
      })}
      action={
        <Link to="/settings" className={buttonClassName({ className: "mt-6" })}>
          {t("nav.settings")}
        </Link>
      }
    />
  );
}
