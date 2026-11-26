import { useI18n } from "@/lib/i18n";

export function OnboardingCompleteStep({ quizhubEnabled }: { quizhubEnabled: boolean }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
      <h2 className="text-xl font-semibold text-zinc-950">{t("onboarding.completeTitle")}</h2>
      <ul className="mt-5 w-full list-disc space-y-2 pl-5 text-left text-sm leading-6 text-zinc-700">
        <li>{t("onboarding.completeTipQuiz")}</li>
        <li>{t("onboarding.completeTipKnowledge")}</li>
        <li>
          {quizhubEnabled
            ? t("onboarding.completeTipQuizhub")
            : t("onboarding.completeTipQuizhubOff")}
        </li>
        <li>{t("onboarding.completeTipSettings")}</li>
      </ul>
    </div>
  );
}
