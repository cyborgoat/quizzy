import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useI18n } from "@/lib/i18n";

export function UnavailableQuestionCard({
  prompt,
  flat = false,
}: {
  prompt?: string;
  flat?: boolean;
}) {
  const { t } = useI18n();

  return (
    <article
      className={
        flat ? "py-2" : "rounded-lg border border-zinc-200 bg-zinc-50 p-4"
      }
    >
      {prompt ? (
        <p className="text-sm font-semibold text-zinc-950">{prompt}</p>
      ) : null}
      <p
        className={
          prompt ? "mt-3 text-sm text-zinc-600" : "text-sm text-zinc-600"
        }
      >
        {t("quiz.unavailable.card")}
      </p>
    </article>
  );
}

export function UnavailableQuestionAlert() {
  const { t } = useI18n();
  return (
    <Alert>
      <AlertTitle>{t("quiz.unavailable.title")}</AlertTitle>
      <AlertDescription>
        {t("quiz.unavailable.alert")}
      </AlertDescription>
    </Alert>
  );
}
