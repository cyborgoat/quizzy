import { ClipboardList } from "lucide-react";
import { SettingsField } from "@/components/settings/SettingsField";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Input } from "@/components/ui/input";
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
      <div className="grid gap-3 md:grid-cols-3">
        <SettingsField
          id="min-mistakes"
          label="Min mistakes"
          hint="Required mistakes when correctness is below the max."
          error={errors.minMistakes}
        >
          <Input
            id="min-mistakes"
            type="number"
            min={1}
            step={1}
            value={draft.minMistakes}
            onChange={(e) => onMinMistakesChange(e.target.value)}
          />
        </SettingsField>

        <SettingsField
          id="min-flags"
          label="Min flags"
          hint="Flagged questions need at least this many flags."
          error={errors.minFlags}
        >
          <Input
            id="min-flags"
            type="number"
            min={1}
            step={1}
            value={draft.minFlags}
            onChange={(e) => onMinFlagsChange(e.target.value)}
          />
        </SettingsField>

        <SettingsField
          id="max-correctness"
          label="Max correctness %"
          hint="Per-question correctness across scored attempts."
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
          />
        </SettingsField>
      </div>
    </SettingsSection>
  );
}
