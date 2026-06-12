import { RefreshCw } from "lucide-react";
import { SyncReportCard } from "@/components/settings/SyncReportCard";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
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
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSynchronize}
          disabled={isSyncing}
        >
          <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? "Synchronizing…" : "Synchronize data"}
        </Button>
      </div>

      {syncSections && lastSyncReport && (
        <div className="mt-3">
          <SyncReportCard sections={syncSections} report={lastSyncReport} />
        </div>
      )}
    </SettingsSection>
  );
}
