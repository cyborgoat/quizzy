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
          disabled={savingFields.has("minMistakes")}
          onChange={(e) => onValueChange("minMistakes", e.target.value)}
          onBlur={() => onValueCommit("minMistakes")}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
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
          disabled={savingFields.has("minFlags")}
          onChange={(e) => onValueChange("minFlags", e.target.value)}
          onBlur={() => onValueCommit("minFlags")}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
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
