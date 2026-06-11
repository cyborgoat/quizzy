import { Palette } from "lucide-react";
import { SettingsField } from "@/components/settings/SettingsField";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SettingsDraft, SettingsDraftErrors } from "@/lib/settingsDraft";
import {
  UI_DENSITY_OPTIONS,
  UI_FONT_SIZE_MAX,
  UI_FONT_SIZE_MIN,
  type UiDensity,
} from "@/lib/uiPreferences";

export function SettingsAppearanceSection({
  draft,
  errors,
  onFontSizeChange,
  onDensityChange,
}: {
  draft: SettingsDraft;
  errors: SettingsDraftErrors;
  onFontSizeChange: (value: string) => void;
  onDensityChange: (value: UiDensity) => void;
}) {
  return (
    <SettingsSection icon={Palette} title="Appearance">
      <div className="grid gap-3 sm:grid-cols-2">
        <SettingsField
          id="font-size"
          label="Font size (%)"
          hint={`${UI_FONT_SIZE_MIN}–${UI_FONT_SIZE_MAX}%. Ctrl/Cmd +/− steps by 5.`}
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

        <SettingsField
          id="layout-density"
          label="Layout density"
          hint="Widen content and add spacing on larger displays."
        >
          <Select
            value={draft.density}
            onValueChange={(value) => onDensityChange(value as UiDensity)}
          >
            <SelectTrigger id="layout-density">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UI_DENSITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsField>
      </div>
    </SettingsSection>
  );
}
