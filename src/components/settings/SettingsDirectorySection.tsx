import { FolderCog } from "lucide-react";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { IconActionButton } from "@/components/ui/icon-action-button";

export function SettingsDirectorySection({
  displayDir,
  directoryPath,
  directoryAvailable,
  hasPendingDirChange,
  onPickDirectory,
}: {
  displayDir: string | null;
  directoryPath: string | null;
  directoryAvailable: boolean;
  hasPendingDirChange: boolean;
  onPickDirectory: () => void;
}) {
  const showUnavailable =
    directoryPath && !directoryAvailable && !hasPendingDirChange;

  return (
    <SettingsSection icon={FolderCog} title="Quiz directory">
      <p className="text-xs text-zinc-500">Quizzy loads quiz JSON files from this folder.</p>
      <div className="mt-2 flex items-center gap-2">
        <code
          className="min-w-0 flex-1 truncate rounded bg-zinc-100 px-2 py-1.5 text-xs text-zinc-700"
          title={displayDir ?? undefined}
        >
          {displayDir ?? "No directory selected"}
        </code>
        <IconActionButton
          icon={FolderCog}
          label={displayDir ? "Change folder" : "Select folder"}
          variant="outline"
          onClick={onPickDirectory}
        />
      </div>
      {showUnavailable && (
        <p className="mt-1.5 text-xs text-red-600">This directory is currently unavailable.</p>
      )}
    </SettingsSection>
  );
}
