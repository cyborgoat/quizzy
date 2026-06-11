import { RefreshCw } from "lucide-react";
import { SyncReportCard } from "@/components/settings/SyncReportCard";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { cn } from "@/lib/utils";
import type { SyncReport } from "@/lib/native";
import type { SyncReportSections } from "@/lib/syncReport";

export function SettingsSyncSection({
  isSyncing,
  syncSections,
  lastSyncReport,
  onSynchronize,
}: {
  isSyncing: boolean;
  syncSections: SyncReportSections | null;
  lastSyncReport: SyncReport | null;
  onSynchronize: () => void;
}) {
  return (
    <SettingsSection icon={RefreshCw} title="Data synchronization">
      <p className="text-xs text-zinc-500">
        Rescan quiz and knowledge folders, repair indexes, and refresh in-app data after external
        file changes. Quiz and knowledge files are not modified.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <IconActionButton
          icon={RefreshCw}
          label="Synchronize data"
          variant="outline"
          onClick={onSynchronize}
          disabled={isSyncing}
        >
          <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
        </IconActionButton>
        {isSyncing && <span className="text-xs text-zinc-500">Synchronizing…</span>}
      </div>

      {syncSections && lastSyncReport && (
        <div className="mt-3">
          <SyncReportCard sections={syncSections} report={lastSyncReport} />
        </div>
      )}
    </SettingsSection>
  );
}
