import { ClipboardList } from "lucide-react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSettingRow } from "@/components/settings/SettingsSettingRow";
import { Input } from "@/components/ui/input";
import { settingsCompactInputClassName } from "@/components/settings/settingsControlStyles";
import type { SettingsDraft, SettingsDraftErrors } from "@/lib/settingsDraft";

export function SettingsMistakeLogSection({
  draft,
  errors,
  onMinMistakesChange,
  onMinFlagsChange,
  onMaxCorrectnessChange,
}: {
  draft: SettingsDraft;
  errors: SettingsDraftErrors;
  onMinMistakesChange: (value: string) => void;
  onMinFlagsChange: (value: string) => void;
  onMaxCorrectnessChange: (value: string) => void;
}) {
  return (
    <SettingsSection icon={ClipboardList} title="Mistake Log">
      <SettingsSettingRow
        label="Min mistakes"
        description="Required mistakes when correctness is below the max."
        error={errors.minMistakes}
      >
        <Input
          id="min-mistakes"
          type="number"
          min={1}
          step={1}
          value={draft.minMistakes}
          onChange={(e) => onMinMistakesChange(e.target.value)}
          className={settingsCompactInputClassName}
        />
      </SettingsSettingRow>

      <SettingsSettingRow
        label="Min flags"
        description="Flagged questions need at least this many flags."
        error={errors.minFlags}
      >
        <Input
          id="min-flags"
          type="number"
          min={1}
          step={1}
          value={draft.minFlags}
          onChange={(e) => onMinFlagsChange(e.target.value)}
          className={settingsCompactInputClassName}
        />
      </SettingsSettingRow>

      <SettingsSettingRow
        label="Max correctness %"
        description="Per-question correctness across scored attempts."
        error={errors.maxCorrectness}
      >
        <Input
          id="max-correctness"
          type="number"
          min={0}
          max={100}
          step={1}
          value={draft.maxCorrectness}
          onChange={(e) => onMaxCorrectnessChange(e.target.value)}
          className={settingsCompactInputClassName}
        />
      </SettingsSettingRow>
    </SettingsSection>
  );
}
