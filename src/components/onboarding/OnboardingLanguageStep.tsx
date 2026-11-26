import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { APP_LOCALES, localeDisplayName, type AppLocale } from "@/lib/locale";

export function OnboardingLanguageStep({
  locale,
  disabled,
  onLocaleChange,
}: {
  locale: AppLocale;
  disabled: boolean;
  onLocaleChange: (locale: AppLocale) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
      <h2 className="text-xl font-semibold text-zinc-950">{t("onboarding.languageTitle")}</h2>
      <div className="mt-5 w-full">
        <Select
          value={locale}
          disabled={disabled}
          onValueChange={(value) => onLocaleChange(value as AppLocale)}
        >
          <SelectTrigger
            id="onboarding-locale"
            className="w-full bg-white"
            aria-label={t("home.languageLabel")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APP_LOCALES.map((id) => (
              <SelectItem key={id} value={id}>
                {localeDisplayName(id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
