import { FolderCog } from "lucide-react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { useI18n } from "@/lib/i18n";

export function SettingsDirectorySection({
  displayDir,
  directoryPath,
  directoryAvailable,
  hasPendingDirChange,
  disabled,
  onPickDirectory,
}: {
  displayDir: string | null;
  directoryPath: string | null;
  directoryAvailable: boolean;
  hasPendingDirChange: boolean;
  disabled: boolean;
  onPickDirectory: () => void;
}) {
  const { t } = useI18n();

  const showUnavailable =
    directoryPath && !directoryAvailable && !hasPendingDirChange;

  return (
    <SettingsSection icon={FolderCog} title={t("settings.directory.title")}>
      <p className="text-xs text-zinc-500">{t("settings.directory.description")}</p>
      <div className="mt-2 flex items-center gap-2">
        <code
          className="min-w-0 flex-1 truncate rounded bg-zinc-100 px-2 py-1.5 text-xs text-zinc-700"
          title={displayDir ?? undefined}
        >
          {displayDir ?? t("settings.directory.none")}
        </code>
        <IconActionButton
          icon={FolderCog}
          label={displayDir ? t("settings.directory.change") : t("settings.directory.select")}
          variant="outline"
          disabled={disabled}
          onClick={onPickDirectory}
        />
      </div>
      {showUnavailable && (
        <p className="mt-1.5 text-xs text-red-600">{t("settings.directory.unavailable")}</p>
      )}
    </SettingsSection>
  );
}
