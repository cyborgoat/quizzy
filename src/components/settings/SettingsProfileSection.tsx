import { User } from "lucide-react";
import { SettingsField } from "@/components/settings/SettingsField";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Input } from "@/components/ui/input";
import type { SettingsDraft } from "@/lib/settingsDraft";

export function SettingsProfileSection({
  draft,
  hasChanges,
  onNameChange,
  onSave,
}: {
  draft: SettingsDraft;
  hasChanges: boolean;
  onNameChange: (name: string) => void;
  onSave: () => void;
}) {
  return (
    <SettingsSection icon={User} title="Profile">
      <SettingsField
        id="full-name"
        label="Full name"
        hint="Shown on the home page."
      >
        <Input
          id="full-name"
          value={draft.name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && hasChanges && onSave()}
          placeholder="Your full name"
          className="max-w-xs"
        />
      </SettingsField>
    </SettingsSection>
  );
}
