import { Languages } from "lucide-react";
import { SettingsField } from "@/components/settings/SettingsField";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { APP_LOCALES, localeDisplayName, type AppLocale } from "@/lib/locale";

export function SettingsLanguageSection({
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
    <SettingsSection icon={Languages} title={t("settings.languageTitle")}>
      <SettingsField
        id="app-locale"
        label={t("settings.languageTitle")}
        hint={t("settings.languageDescription")}
      >
        <Select
          value={locale}
          disabled={disabled}
          onValueChange={(value) => onLocaleChange(value as AppLocale)}
        >
          <SelectTrigger id="app-locale" className="max-w-xs bg-white">
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
      </SettingsField>
    </SettingsSection>
  );
}
