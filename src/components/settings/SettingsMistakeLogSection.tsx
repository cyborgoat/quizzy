import { ClipboardList } from "lucide-react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSettingRow } from "@/components/settings/SettingsSettingRow";
import { Input } from "@/components/ui/input";
import { settingsCompactInputClassName } from "@/components/settings/settingsControlStyles";
import type {
  NumericSettingsFieldKey,
  SettingsDraft,
  SettingsDraftErrors,
} from "@/lib/settingsDraft";
import { useI18n } from "@/lib/i18n";

export function SettingsMistakeLogSection({
  draft,
  errors,
  savingFields,
  onValueChange,
  onValueCommit,
}: {
  draft: SettingsDraft;
  errors: SettingsDraftErrors;
  savingFields: ReadonlySet<keyof SettingsDraft | "workingDirectory">;
  onValueChange: (field: NumericSettingsFieldKey, value: string) => void;
  onValueCommit: (field: NumericSettingsFieldKey) => void;
}) {
  const { t } = useI18n();

  return (
    <SettingsSection icon={ClipboardList} title={t("nav.mistakes")}>
      <SettingsSettingRow
        label={t("settings.mistakeLog.minMistakes")}
        description={t("settings.mistakeLog.minMistakesDescription")}
        error={errors.minMistakes && t(errors.minMistakes)}
      >
        <Input
          id="min-mistakes"
          type="number"
          min={1}
          step={1}
          value={draft.minMistakes}
          disabled={savingFields.has("minMistakes")}
          onChange={(e) => onValueChange("minMistakes", e.target.value)}
          onBlur={() => onValueCommit("minMistakes")}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className={settingsCompactInputClassName}
        />
      </SettingsSettingRow>

      <SettingsSettingRow
        label={t("settings.mistakeLog.minFlags")}
        description={t("settings.mistakeLog.minFlagsDescription")}
        error={errors.minFlags && t(errors.minFlags)}
      >
        <Input
          id="min-flags"
          type="number"
          min={1}
          step={1}
          value={draft.minFlags}
          disabled={savingFields.has("minFlags")}
          onChange={(e) => onValueChange("minFlags", e.target.value)}
          onBlur={() => onValueCommit("minFlags")}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className={settingsCompactInputClassName}
        />
      </SettingsSettingRow>

      <SettingsSettingRow
        label={t("settings.mistakeLog.maxCorrectness")}
        description={t("settings.mistakeLog.maxCorrectnessDescription")}
        error={errors.maxCorrectness && t(errors.maxCorrectness)}
      >
        <Input
          id="max-correctness"
          type="number"
          min={0}
          max={100}
          step={1}
          value={draft.maxCorrectness}
          disabled={savingFields.has("maxCorrectness")}
          onChange={(e) => onValueChange("maxCorrectness", e.target.value)}
          onBlur={() => onValueCommit("maxCorrectness")}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className={settingsCompactInputClassName}
        />
      </SettingsSettingRow>
    </SettingsSection>
  );
}
