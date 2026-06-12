import { Palette } from "lucide-react";
import { SettingsField } from "@/components/settings/SettingsField";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Input } from "@/components/ui/input";
import type { SettingsDraft, SettingsDraftErrors } from "@/lib/settingsDraft";
import { UI_FONT_SIZE_MAX, UI_FONT_SIZE_MIN } from "@/lib/uiPreferences";

export function SettingsAppearanceSection({
  draft,
  errors,
  onFontSizeChange,
}: {
  draft: SettingsDraft;
  errors: SettingsDraftErrors;
  onFontSizeChange: (value: string) => void;
}) {
  return (
    <SettingsSection icon={Palette} title="Appearance">
      <SettingsField
        id="font-size"
        label="Font size (%)"
        hint={`${UI_FONT_SIZE_MIN}–${UI_FONT_SIZE_MAX}%. Ctrl/Cmd +/− or scroll wheel steps by 5.`}
        error={errors.fontSize}
      >
        <Input
          id="font-size"
          type="number"
          min={UI_FONT_SIZE_MIN}
          max={UI_FONT_SIZE_MAX}
          step={5}
          value={draft.fontSize}
          onChange={(e) => onFontSizeChange(e.target.value)}
        />
      </SettingsField>
    </SettingsSection>
  );
}
