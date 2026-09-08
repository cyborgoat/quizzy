import { Shuffle } from "lucide-react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSettingRow } from "@/components/settings/SettingsSettingRow";
import { Switch } from "@/components/ui/switch";
import type { SettingsDraft } from "@/lib/settingsDraft";

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
  return (
    <SettingsSection icon={Shuffle} title="Quiz preferences">
      <SettingsSettingRow
        label="Shuffle questions"
        description="Randomize order within each question type group. Mistake Log review keeps file order."
      >
        <Switch
          checked={draft.shuffleQuestions}
          disabled={savingFields.has("shuffleQuestions")}
          onCheckedChange={onShuffleQuestionsChange}
          aria-label="Shuffle questions"
        />
      </SettingsSettingRow>

      <SettingsSettingRow
        label="Shuffle options"
        description="Randomize answer order while keeping correct answers mapped. Mistake Log keeps file order."
      >
        <Switch
          checked={draft.shuffleOptions}
          disabled={savingFields.has("shuffleOptions")}
          onCheckedChange={onShuffleOptionsChange}
          aria-label="Shuffle options"
        />
      </SettingsSettingRow>
    </SettingsSection>
  );
}
