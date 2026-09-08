import { User } from "lucide-react";
import { SettingsField } from "@/components/settings/SettingsField";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Input } from "@/components/ui/input";
import type { SettingsDraft } from "@/lib/settingsDraft";

export function SettingsProfileSection({
  draft,
  disabled,
  onNameChange,
  onNameCommit,
}: {
  draft: SettingsDraft;
  disabled: boolean;
  onNameChange: (name: string) => void;
  onNameCommit: () => void;
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
          disabled={disabled}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onNameCommit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          placeholder="Your full name"
          className="max-w-xs"
        />
      </SettingsField>
    </SettingsSection>
  );
}
