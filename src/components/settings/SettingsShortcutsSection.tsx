import { Keyboard } from "lucide-react";
import { HotkeyRecorder } from "@/components/settings/HotkeyRecorder";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSettingRow } from "@/components/settings/SettingsSettingRow";
import { SHORTCUT_FIELDS, type ShortcutDraftKey } from "@/lib/keybinds";
import type { SettingsDraft, SettingsDraftErrors } from "@/lib/settingsDraft";

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
  return (
    <SettingsSection icon={Keyboard} title="Shortcuts">
      {SHORTCUT_FIELDS.map((field) => (
        <SettingsSettingRow
          key={field.draftKey}
          label={field.label}
          description={field.description}
          error={errors[field.draftKey]}
        >
          <HotkeyRecorder
            value={draft[field.draftKey]}
            disabled={savingFields.has(field.draftKey)}
            onChange={(value) => onShortcutChange(field.draftKey, value)}
            aria-label={`Change shortcut for ${field.label}`}
          />
        </SettingsSettingRow>
      ))}
    </SettingsSection>
  );
}
