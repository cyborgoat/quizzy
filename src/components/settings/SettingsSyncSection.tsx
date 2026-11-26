import { RefreshCw } from "lucide-react";
import { SyncReportCard } from "@/components/settings/SyncReportCard";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SyncReport } from "@/lib/native";
import type { SyncReportSections } from "@/lib/syncReport";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

  return (
    <SettingsSection icon={RefreshCw} title={t("settings.sync.title")}>
      <p className="text-xs text-zinc-500">
        {t("settings.sync.description")}
      </p>
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSynchronize}
          disabled={isSyncing}
        >
          <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? t("settings.sync.syncing") : t("settings.sync.action")}
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
