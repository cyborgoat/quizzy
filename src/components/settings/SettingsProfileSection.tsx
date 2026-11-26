import { User } from "lucide-react";
import { SettingsField } from "@/components/settings/SettingsField";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Input } from "@/components/ui/input";
import type { SettingsDraft } from "@/lib/settingsDraft";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

  return (
    <SettingsSection icon={User} title={t("settings.profile.title")}>
      <SettingsField
        id="full-name"
        label={t("settings.profile.nameLabel")}
        hint={t("settings.profile.nameHint")}
      >
        <Input
          id="full-name"
          value={draft.name}
          disabled={disabled}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onNameCommit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          placeholder={t("settings.profile.namePlaceholder")}
          className="max-w-xs"
        />
      </SettingsField>
    </SettingsSection>
  );
}
