import { Shuffle } from "lucide-react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsSwitchRow } from "@/components/settings/SettingsSwitchRow";
import type { SettingsDraft } from "@/lib/settingsDraft";

export function SettingsQuizPreferencesSection({
  draft,
  onShuffleQuestionsChange,
  onShuffleOptionsChange,
}: {
  draft: SettingsDraft;
  onShuffleQuestionsChange: (value: boolean) => void;
  onShuffleOptionsChange: (value: boolean) => void;
}) {
  return (
    <SettingsSection icon={Shuffle} title="Quiz preferences">
      <div className="space-y-3">
        <SettingsSwitchRow
          id="shuffle-questions-label"
          label="Shuffle questions"
          hint="Randomize order within each question type group. Mistake Log review keeps file order."
          checked={draft.shuffleQuestions}
          onCheckedChange={onShuffleQuestionsChange}
        />
        <SettingsSwitchRow
          id="shuffle-options-label"
          label="Shuffle options"
          hint="Randomize answer order while keeping correct answers mapped. Mistake Log keeps file order."
          checked={draft.shuffleOptions}
          onCheckedChange={onShuffleOptionsChange}
          divider
        />
      </div>
    </SettingsSection>
  );
}
