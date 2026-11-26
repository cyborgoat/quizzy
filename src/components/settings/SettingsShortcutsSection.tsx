import { Keyboard } from "lucide-react";
import { HotkeyRecorder } from "@/components/settings/HotkeyRecorder";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSettingRow } from "@/components/settings/SettingsSettingRow";
import { SHORTCUT_FIELDS, type ShortcutDraftKey } from "@/lib/keybinds";
import type { SettingsDraft, SettingsDraftErrors } from "@/lib/settingsDraft";
import { useI18n } from "@/lib/i18n";

export function SettingsShortcutsSection({
  draft,
  errors,
  savingFields,
  onShortcutChange,
}: {
  draft: SettingsDraft;
  errors: SettingsDraftErrors;
  savingFields: ReadonlySet<keyof SettingsDraft | "workingDirectory">;
  onShortcutChange: (field: ShortcutDraftKey, value: string) => void;
}) {
  const { t } = useI18n();

  return (
    <SettingsSection icon={Keyboard} title={t("settings.shortcuts.title")}>
      {SHORTCUT_FIELDS.map((field) => (
        <SettingsSettingRow
          key={field.draftKey}
          label={t(field.labelKey)}
          description={t(field.descriptionKey)}
          error={errors[field.draftKey] && t(errors[field.draftKey]!)}
        >
          <HotkeyRecorder
            value={draft[field.draftKey]}
            disabled={savingFields.has(field.draftKey)}
            onChange={(value) => onShortcutChange(field.draftKey, value)}
            aria-label={t("settings.shortcuts.changeAria", { label: t(field.labelKey) })}
          />
        </SettingsSettingRow>
      ))}
    </SettingsSection>
  );
}
