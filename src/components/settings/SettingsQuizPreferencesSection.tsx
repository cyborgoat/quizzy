import { Shuffle } from "lucide-react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSettingRow } from "@/components/settings/SettingsSettingRow";
import { Switch } from "@/components/ui/switch";
import type { SettingsDraft } from "@/lib/settingsDraft";
import { useI18n } from "@/lib/i18n";

export function SettingsQuizPreferencesSection({
  draft,
  savingFields,
  onShuffleQuestionsChange,
  onShuffleOptionsChange,
}: {
  draft: SettingsDraft;
  savingFields: ReadonlySet<keyof SettingsDraft | "workingDirectory">;
  onShuffleQuestionsChange: (value: boolean) => void;
  onShuffleOptionsChange: (value: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <SettingsSection icon={Shuffle} title={t("settings.quizPrefs.title")}>
      <SettingsSettingRow
        label={t("settings.quizPrefs.shuffleQuestions")}
        description={t("settings.quizPrefs.shuffleQuestionsDescription")}
      >
        <Switch
          checked={draft.shuffleQuestions}
          disabled={savingFields.has("shuffleQuestions")}
          onCheckedChange={onShuffleQuestionsChange}
          aria-label={t("settings.quizPrefs.shuffleQuestions")}
        />
      </SettingsSettingRow>

      <SettingsSettingRow
        label={t("settings.quizPrefs.shuffleOptions")}
        description={t("settings.quizPrefs.shuffleOptionsDescription")}
      >
        <Switch
          checked={draft.shuffleOptions}
          disabled={savingFields.has("shuffleOptions")}
          onCheckedChange={onShuffleOptionsChange}
          aria-label={t("settings.quizPrefs.shuffleOptions")}
        />
      </SettingsSettingRow>
    </SettingsSection>
  );
}
